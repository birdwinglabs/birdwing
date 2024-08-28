import { dirname } from 'path';
import { ParsedDocument, SourceDocument } from "./interfaces.js";

import ev from "eventemitter3";
import { isSubPath } from './util.js';
import { ContentParser, Store } from './store.js';

const { EventEmitter } = ev;


function partialIds(content: ParsedDocument) {
  return new Set(content.partials.map(p => `partial:${p}`));
}

function fragmentIds(content: ParsedDocument, fragments: ParsedDocument[]) {
  if (content.type === 'page') {
    return new Set(fragments
      .filter(f => isSubPath(content.path, dirname(f.path)))
      .map(f => f.id));
  } else {
    return new Set<string>();
  }
}

export class DependencyGraph {
  private dependencies: Record<string, Set<string>> = {};

  constructor(content: ParsedDocument[]) {
    const fragments = content.filter(c => c.type === 'fragment');
    for (const doc of content) {
      this.dependencies[doc.id] = new Set([...partialIds(doc), ...fragmentIds(doc, fragments)]);
    }
  }

  dependants(id: string): string[] {
    const set = Object.entries(this.dependencies).reduce((dependants, [p, deps]) => {
      if (deps.has(id)) {
        return new Set<string>([...dependants, ...this.dependants(p), p]);
      }
      return dependants;
    }, new Set<string>());

    return Array.from(set);
  }
}

export interface PartialChangedEvent {
  doc: ParsedDocument;

  affected: ParsedDocument[];
}

export interface FragmentChangedEvent {
  doc: ParsedDocument;

  affected: ParsedDocument[];
}

export interface CacheWatcher {
  on(event: 'page-changed', handler: (doc: ParsedDocument) => void): this;
  on(event: 'fragment-changed', handler: (event: FragmentChangedEvent) => void): this;
  on(event: 'partial-changed', handler: (event: PartialChangedEvent) => void): this;
}

export class ContentCache {
  private watcher = new EventEmitter();
  private contentMap: Record<string, ParsedDocument> = {}
  private depGraph: DependencyGraph;

  static async load(store: Store) {
    const parser = new ContentParser();
    const content = await store.findContent({}).toArray();
    const parsedContent: ParsedDocument[] = [];

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

  constructor(documents: ParsedDocument[], private parser: ContentParser) {
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
    return this.content.filter(c => c.type === 'partial');
  }

  update(doc: SourceDocument) {
    const parsed = this.parser.parse(doc);
    if (!parsed) {
      return false;
    }

    this.contentMap[parsed.id] = parsed;

    const affected = (id: string) => {
      const affectedIds = this.depGraph.dependants(id);
      return affectedIds.reduce((affected, id) => {
        affected.push(this.contentMap[id]);
        return affected;
      }, [] as ParsedDocument[]);
    }

    switch (parsed.type) {
      case 'partial':
        this.watcher.emit('partial-changed', { doc: parsed, affected: affected(parsed.id) });
        break;
      case 'page':
        this.watcher.emit('page-changed', parsed);
        break;
      case 'fragment':
        this.watcher.emit('fragment-changed', { doc: parsed, affected: affected(parsed.id) });
        break;
    }
  }
}
