import { Database, Filter, Collection, Document } from '@tashmet/tashmet';
import { PageData, Route, TargetFile } from "./interfaces.js";

import ev from "eventemitter3";
import { Plugin, PluginContext } from './plugin.js';
import { ContentLoader } from './loader.js';
import { Pipeline } from './pipeline.js';
import { Compiler, ContentTarget } from './compiler.js';

const { EventEmitter } = ev;

export class Aetlan extends EventEmitter {
  private contentLoader: ContentLoader;

  constructor(
    private source: Collection,
    private cache: Collection<PageData>,
    private routes: Collection<Route>,
    private target: Collection<TargetFile>,
    private pluginContext: PluginContext,
  ) {
    super();
    this.contentLoader = new ContentLoader(pluginContext);
  }

  static async load(db: Database, plugins: Plugin[]): Promise<Aetlan> {
    const source = db.collection('pagesource');
    const cache = db.collection<PageData>('pagecache');
    const routes = db.collection<Route>('routes');
    const target = db.collection<TargetFile>('target');

    await source.aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: cache.collectionName }
    ]).toArray();

    return new Aetlan(source, cache, routes, target, new PluginContext(plugins));
  }

  async reloadContent(file: string) {
    const doc = await this.source.aggregate<PageData>()
      .match({ _id: file })
      .set({ ast: { $markdocToAst: '$body' }})
      .next();

    if (doc) {
      await this.cache.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }

  findContent(filter: Filter<PageData>) {
    return this.cache.find(filter);
  }

  getRoute(url: string) {
    return this.routes.findOne({ _id: url !== '/' ? url.replace(/\/$/, "") : url });
  }

  async updateRoute(route: Route) {
    await this.routes.replaceOne({ _id: route.url }, route, { upsert: true });
  }

  async updateRouteAttributes(url: string, attributes: Document) {
    await this.routes.updateOne(
      { _id: url }, { $set: { 'tag.attributes': attributes } }
    );
  }

  async write(file: string, content: string) {
    await this.target.replaceOne({ _id: file }, { _id: file, content }, { upsert: true });
  }

  async getOutput(file: string): Promise<string | null> {
    const f = await this.target.findOne({ _id: file });
    if (f) {
      return f.content;
    }
    return null;
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
    return new Pipeline(this.cache, target, compiler, this.contentLoader);
  }

  private async createCompiler() {
    const content = await this.cache.find().toArray();
    const nodes = content.map(c => this.contentLoader.load(c));
    return new Compiler(nodes, this.pluginContext.tags);
  }
}
