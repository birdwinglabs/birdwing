import { dirname } from 'path';
import { Database, Document } from '@tashmet/tashmet';
import { ParsedDocument, Route } from "./interfaces.js";

import ev from "eventemitter3";
import { ContentLoader, ContentMountPoint } from './loader.js';
import { Pipeline } from './pipeline.js';
import { Compiler, ContentTarget } from './compiler.js';
import { Transformer } from './transformer.js';
import { Node, Schema } from '@markdoc/markdoc';
import { Plugin } from './plugin.js';
import { ContentParser, Store } from './store.js';
import { isSubPath } from './util.js';

const { EventEmitter } = ev;


export interface AetlanConfig {
  tags: Record<string, Schema>;

  nodes: Record<string, Schema>;

  documents: Record<string, Schema>;

  content: ContentMountPoint[];

  plugins: Plugin[];

  variables: Document;
}

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

export class Aetlan extends EventEmitter {
  private contentLoader: ContentLoader;
  private contentParser: ContentParser;

  constructor(
    public store: Store,
    private config: AetlanConfig,
  ) {
    super();
    this.contentLoader = ContentLoader.configure(config.plugins, config.content);
    this.contentParser = new ContentParser();
  }

  static async load(db: Database, config: AetlanConfig): Promise<Aetlan> {
    return new Aetlan(Store.fromDatabase(db), config);
  }

  async compile(): Promise<Route[]> {
    const parsedContent = await this.loadContent();

    const fileNodes = parsedContent
      .filter(c => c.type !== 'partial')
      .map(p => this.contentLoader.load(p));

    const transformer = this.createTransformer(parsedContent.filter(c => c.type === 'partial'));
    return new Compiler(fileNodes, transformer)
      .transform()
      .compileRoutes();
  }

  async watch(target: ContentTarget) {
    const parsedContent = await this.loadContent();

    const fileNodes = parsedContent
      .filter(c => c.type !== 'partial')
      .map(p => this.contentLoader.load(p));

    const depGraph = new DependencyGraph(parsedContent);

    const transformer = this.createTransformer(parsedContent.filter(c => c.type === 'partial'));
    const compiler = new Compiler(fileNodes, transformer);

    for (const route of await compiler.transform().compileRoutes()) {
      target.mount(route);
    }
    return new Pipeline(this.store, target, compiler, transformer, this.contentParser, this.contentLoader, depGraph);
  }

  private createTransformer(partials: ParsedDocument[] = []) {
    const { tags, nodes, documents, variables } = this.config;
    const transformer = new Transformer(tags, nodes, documents, {}, variables);
    for (const {path, ast} of partials) {
      transformer.setPartial(path, ast);
    }
    return transformer;
  }

  private async loadContent() {
    const content = await this.store.findContent({}).toArray();
    const parsedContent: ParsedDocument[] = [];

    for (const c of content) {
      const parsed = this.contentParser.parse(c);
      if (parsed) {
        parsedContent.push(parsed);
      }
    }

    return parsedContent;
  }
}
