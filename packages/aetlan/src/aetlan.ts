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
    const compiler = await this.createCompiler();

    return compiler.transform().compileRoutes();
  }

  async watch(target: ContentTarget) {
    const compiler = await this.createCompiler();

    for (const route of await compiler.transform().compileRoutes()) {
      target.mount(route);
    }
    return new Pipeline(this.store, target, compiler, new ContentParser(), this.contentLoader);
  }

  private async createCompiler() {
    const parser = new ContentParser();
    const { tags, nodes, documents } = this.config;
    const content = await this.store.findContent({}).toArray();
    const parsedContent: ParsedDocument[] = [];

    for (const c of content) {
      const parsed = parser.parse(c);
      if (parsed) {
        parsedContent.push(parsed);
      }
    }

    const fileNodes = parsedContent
      .filter(c => c.type !== 'partial')
      .map(p => this.contentLoader.load(p));

    const partialMap = parsedContent
      .filter(c => c.type === 'partial')
      .reduce((map, partial) => {
        map[partial.path] = partial.ast;
        return map;
      }, {} as Record<string, Node>);

    const transformer = new Transformer(tags, nodes, documents, partialMap, this.config.variables);
    return new Compiler(fileNodes, transformer);
  }
}
