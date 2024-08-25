import { Database, Filter, Collection, Document } from '@tashmet/tashmet';
import { ParsedDocument, Route, SourceDocument, TargetFile } from "./interfaces.js";

import ev from "eventemitter3";
import { ContentLoader, ContentMountPoint } from './loader.js';
import { Pipeline } from './pipeline.js';
import { Compiler, ContentTarget } from './compiler.js';
import { Transformer } from './transformer.js';
import { Node, Schema } from '@markdoc/markdoc';
import { Plugin } from './plugin.js';

const { EventEmitter } = ev;


export interface AetlanConfig {
  tags: Record<string, Schema>;

  nodes: Record<string, Schema>;

  documents: Record<string, Schema>;

  content: ContentMountPoint[];

  plugins: Plugin[];

  variables: Document;
}

export interface SourceLoadResult {
  pages: ParsedDocument[];

  partials: ParsedDocument[];
}

export async function loadSource(source: Collection<SourceDocument>, filter?: Document) {
  const pipeline: Document[] = [
    { $set: { ast: { $markdocToAst: '$body' } } },
    {
      $facet: {
        pages: [
          { $match: { path: /^pages\// } },
          { $set: { path: { $relativePath: ['pages/', '$path'] } } },
        ],
        partials: [
          { $match: { path: /^partials\// } },
          { $set: { path: { $relativePath: ['partials/', '$path'] } } },
        ],
      }
    },
  ];

  if (filter) {
    pipeline.unshift({ $match: filter });
  }

  const res = await source.aggregate<SourceLoadResult>(pipeline).next();

  if (!res) {
    throw Error('Failed to load source');
  }
  return res;
}

export class Aetlan extends EventEmitter {
  private contentLoader: ContentLoader;

  constructor(
    private source: Collection<SourceDocument>,
    private pages: Collection<ParsedDocument>,
    private partials: Collection<ParsedDocument>,
    private routes: Collection<Route>,
    private target: Collection<TargetFile>,
    private config: AetlanConfig,
  ) {
    super();
    this.contentLoader = ContentLoader.configure(config.plugins, config.content);
  }

  static async load(db: Database, config: AetlanConfig): Promise<Aetlan> {
    const source = db.collection<SourceDocument>('source');
    const pages = db.collection<ParsedDocument>('pages');
    const partials = db.collection<ParsedDocument>('partials');
    const routes = db.collection<Route>('routes');
    const target = db.collection<TargetFile>('target');

    const loadRes = await loadSource(source);

    await pages.insertMany(loadRes.pages);
    await partials.insertMany(loadRes.partials);

    return new Aetlan(source, pages, partials, routes, target, config);
  }

  async reloadContent(file: string) {
    const loadRes = await loadSource(this.source, { _id: file });

    for (const doc of loadRes.pages) {
      await this.pages.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
    for (const doc of loadRes.partials) {
      await this.partials.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }

  findContent(filter: Filter<ParsedDocument>) {
    return this.pages.find(filter);
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
    return new Pipeline(this.pages, target, compiler, this.contentLoader);
  }

  private async createCompiler() {
    const { tags, nodes, documents } = this.config;
    const content = await this.pages.find().toArray();
    const fileNodes = content.map(c => this.contentLoader.load(c));
    const partials = await this.partials.find().toArray();
    const partialMap = partials.reduce((map, partial) => {
      map[partial.path] = partial.ast;
      return map;
    }, {} as Record<string, Node>);
    const transformer = new Transformer(tags, nodes, documents, partialMap, this.config.variables);
    return new Compiler(fileNodes, transformer);
  }
}
