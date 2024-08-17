import { Database, Filter, Collection } from '@tashmet/tashmet';
import { PageData, Plugin, Route, Fragment, FileHandler, TargetFile } from "./interfaces.js";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';
import ev from "eventemitter3";
import { RenderablePage } from './transformer.js';

const { EventEmitter } = ev;

export class Aetlan extends EventEmitter {
  constructor(
    private source: Collection,
    private cache: Collection<PageData>,
    private routes: Collection<Route>,
    private target: Collection<TargetFile>,
  ) {
    super();
    cache.watch().on('change', change => {
      if (change.operationType === 'replace' && change.fullDocument) {
        this.emit('content-changed', change.fullDocument);
      }
    });
  }

  static async load(db: Database): Promise<Aetlan> {
    const source = db.collection('pagesource');
    const cache = db.collection<PageData>('pagecache');
    const routes = db.collection<Route>('routes');
    const target = db.collection<TargetFile>('target');

    await source.aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: cache.collectionName }
    ]).toArray();

    return new Aetlan(source, cache, routes, target);
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

  async updateRoute(page: RenderablePage) {
    const route: Route = { _id: page.url, url: page.url, tag: await page.compile() };
    await this.routes.replaceOne({ _id: page.url }, route, { upsert: true });
  }

  async updateRouteAttributes(page: RenderablePage) {
    await this.routes.updateOne(
      { _id: page.url }, { $set: { 'tag.attributes': await page.attributes() } }
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
}


export function createFileHandlers(plugins: Plugin[]) {
  const handlers: FileHandler[] = [];
  for (const plugin of plugins) {
    handlers.push(...plugin.handlers);
  }
  return handlers;
}

export async function generateCss(root: string) {
  const cssProc = postcss([
    tailwind({
      config: path.join(root, 'tailwind.config.js'),
    })
  ]);

  const cssPath = path.join(root, 'src/main.css');
  const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to: path.join(root, 'out/main.css') });

  return css.css;
}