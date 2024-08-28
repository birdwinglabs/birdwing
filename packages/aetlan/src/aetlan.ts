import { Database, Document } from '@tashmet/tashmet';
import { ParsedDocument, Route } from "./interfaces.js";

import ev from "eventemitter3";
import { ContentLoader, ContentMountPoint } from './loader.js';
import { Pipeline } from './pipeline.js';
import { Compiler, ContentTarget } from './compiler.js';
import { Transformer } from './transformer.js';
import { Schema } from '@markdoc/markdoc';
import { Plugin } from './plugin.js';
import { Store } from './store.js';
import { ContentCache } from './cache.js';

const { EventEmitter } = ev;


export interface AetlanConfig {
  tags: Record<string, Schema>;

  nodes: Record<string, Schema>;

  documents: Record<string, Schema>;

  content: ContentMountPoint[];

  plugins: Plugin[];

  variables: Document;
}

export class Aetlan extends EventEmitter {
  private contentLoader: ContentLoader;

  constructor(
    public store: Store,
    private config: AetlanConfig,
  ) {
    super();
    this.contentLoader = ContentLoader.configure(config.plugins, config.content);
  }

  static async load(db: Database, config: AetlanConfig): Promise<Aetlan> {
    return new Aetlan(Store.fromDatabase(db), config);
  }

  async compile(): Promise<Route[]> {
    const cache = await ContentCache.load(this.store);

    const fileNodes = cache.content
      .filter(c => c.type !== 'partial')
      .map(p => this.contentLoader.load(p));

    const transformer = this.createTransformer(cache.partials);

    return new Compiler(fileNodes, transformer)
      .transform()
      .compileRoutes();
  }

  async watch(target: ContentTarget) {
    const cache = await ContentCache.load(this.store);

    const fileNodes = cache.content
      .filter(c => c.type !== 'partial')
      .map(p => this.contentLoader.load(p));

    const transformer = this.createTransformer(cache.partials);
    const compiler = new Compiler(fileNodes, transformer);

    for (const route of await compiler.transform().compileRoutes()) {
      target.mount(route);
    }
    return new Pipeline(cache, target, compiler, transformer, this.contentLoader);
  }

  private createTransformer(partials: ParsedDocument[] = []) {
    const { tags, nodes, documents, variables } = this.config;
    const transformer = new Transformer(tags, nodes, documents, {}, variables);
    for (const {path, ast} of partials) {
      transformer.setPartial(path, ast);
    }
    return transformer;
  }
}
