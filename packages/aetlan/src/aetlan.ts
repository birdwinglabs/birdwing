import { Database, Document } from '@tashmet/tashmet';
import { ContentMountPoint, PartialDocument, Route } from "./interfaces.js";

import ev from "eventemitter3";
import { Compiler } from './compiler.js';
import { Transformer } from './transformer.js';
import { Schema } from '@markdoc/markdoc';
import { Plugin, PluginConfig } from './plugin.js';
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
  constructor(
    public store: Store,
    private config: AetlanConfig,
  ) {
    super();
  }

  static async load(db: Database, config: AetlanConfig): Promise<Aetlan> {
    return new Aetlan(Store.fromDatabase(db), config);
  }

  async compile(): Promise<Route[]> {
    const cache = await ContentCache.load(this.store);
    const transformer = this.createTransformer(cache.partials);
    const plugins = this.createPlugins(transformer);

    return new Compiler(plugins, transformer, cache).transform();
  }

  async watch() {
    const cache = await ContentCache.load(this.store);
    const transformer = this.createTransformer(cache.partials);
    const plugins = this.createPlugins(transformer);
    const compiler = new Compiler(plugins, transformer, cache);

    return compiler.watch();
  }

  private createTransformer(partials: PartialDocument[] = []) {
    const { tags, nodes, documents, variables } = this.config;
    const transformer = new Transformer(tags, nodes, documents, {}, variables);
    for (const {path, ast} of partials) {
      transformer.setPartial(path, ast);
    }
    return transformer;
  }

  private createPlugins(transformer: Transformer) {
    return this.config.content.reduce((pluginMap, config) => {
      const plugin = this.config.plugins.find(p => p.name === config.plugin);

      if (plugin) {
        pluginMap[config.path] = plugin.mount(config.path, transformer);
      }

      return pluginMap;
    }, {} as Record<string, PluginConfig<Route>>)
  }
}
