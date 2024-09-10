import { dirname } from 'path';
import { AbstractDocument, FragmentDocument, PageDocument, PartialDocument, SourceDocument } from "./interfaces.js";

import ev from "eventemitter3";
import { isSubPath } from './util.js';
import { Store } from './store.js';
import { ContentParser } from './parser.js';

const { EventEmitter } = ev;


function partialIds(doc: AbstractDocument) {
  return new Set(doc.partials.map(p => `partial:${p}`));
}

function fragmentIds(doc: PageDocument, fragments: FragmentDocument[]) {
  return new Set(fragments
    .filter(f => isSubPath(doc.path, dirname(f.path)))
    .map(f => f.id));
}

export class DependencyGraph {
  private deps: Record<string, Set<string>> = {};

  constructor(content: AbstractDocument[]) {
    const fragments = content.filter(c => c instanceof FragmentDocument) as FragmentDocument[];
    for (const doc of content) {
      let deps = partialIds(doc);
      if (doc instanceof PageDocument) {
        deps = new Set([...deps, ...fragmentIds(doc, fragments)]);
      }
      this.deps[doc.id] = deps;
    }
  }

  dependencies(id: string): string[] {
    return Array.from(this.deps[id]);
  }

  dependants(id: string): string[] {
    const set = Object.entries(this.deps).reduce((dependants, [p, deps]) => {
      if (deps.has(id)) {
        return new Set<string>([...dependants, ...this.dependants(p), p]);
      }
      return dependants;
    }, new Set<string>());

    return Array.from(set);
  }
}

export interface PartialChangedEvent {
  doc: PartialDocument;

  affected: AbstractDocument[];
}

export interface FragmentChangedEvent {
  doc: FragmentDocument;

  affected: PageDocument[];
}

export interface CacheWatcher {
  on(event: 'page-changed', handler: (doc: PageDocument) => void): this;
  on(event: 'fragment-changed', handler: (event: FragmentChangedEvent) => void): this;
  on(event: 'partial-changed', handler: (event: PartialChangedEvent) => void): this;
}

export class ContentCache {
  private watcher = new EventEmitter();
  private contentMap: Record<string, AbstractDocument> = {}
  private depGraph: DependencyGraph;

  static async load(store: Store) {
    const parser = new ContentParser();
    const content = await store.findContent({}).toArray();
    const parsedContent: AbstractDocument[] = [];

    for (const c of content) {
      const parsed = parser.parse(c);
      if (parsed) {
        parsedContent.push(parsed);
      }
    }

    const cache = new ContentCache(parsedContent, parser);

    store.watch().on('content-changed', (doc) => {
      cache.update(doc);
    });

    return cache;
  }

  constructor(documents: AbstractDocument[], private parser: ContentParser) {
    for (const doc of documents) {
      this.contentMap[doc.id] = doc;
    }
    this.depGraph = new DependencyGraph(documents);
  }

  watch(): CacheWatcher {
    return this.watcher;
  }

  get content() {
    return Object.values(this.contentMap);
  }

  get partials() {
    return this.content.filter(c => c instanceof PartialDocument);
  }

  dependencies(doc: AbstractDocument): AbstractDocument[] {
    const affectedIds = this.depGraph.dependencies(doc.id);
    return affectedIds.reduce((affected, id) => {
      affected.push(this.contentMap[id]);
      return affected;
    }, [] as AbstractDocument[]);
  }

  dependants(doc: AbstractDocument): AbstractDocument[] {
    const affectedIds = this.depGraph.dependants(doc.id);
    return affectedIds.reduce((affected, id) => {
      affected.push(this.contentMap[id]);
      return affected;
    }, [] as AbstractDocument[]);
  }

  update(doc: SourceDocument) {
    const parsed = this.parser.parse(doc);
    if (!parsed) {
      return false;
    }

    this.contentMap[parsed.id] = parsed;

    switch (parsed.type) {
      case 'partial':
        this.watcher.emit('partial-changed', { doc: parsed, affected: this.dependants(parsed) });
        break;
      case 'page':
        this.watcher.emit('page-changed', parsed);
        break;
      case 'fragment':
        this.watcher.emit('fragment-changed', { doc: parsed, affected: this.dependants(parsed) });
        break;
    }
  }
}
