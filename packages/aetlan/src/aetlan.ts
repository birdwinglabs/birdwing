import { Document, Database, Filter, Collection } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { PageData, Plugin, Route, Fragment, FileHandler } from "./interfaces.js";
import TashmetServer from '@tashmet/server';
import http from 'http';

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';
import { ContentFactory } from "./contentFactory.js";
import { createDatabase, createStorageEngine } from './database.js';
import { RenderablePage, Transformer } from './transformer.js';


export class DevWatcher {
  private pages: RenderablePage[] = [];

  constructor(
    private transformer: Transformer,
    private content: Collection<PageData>,
    private routes: Collection<Route>,
  ) {
    transformer.on('page-updated', async (page: RenderablePage) => {
      await this.createRoute(page);
    });
    transformer.on('fragment-updated', async (fragment: Fragment) => {
      for (const page of this.pages) {
        await this.createRoute(page);
      }
    });
    transformer.on('fragment-added', (fragment: Fragment) => {
    });
  }

  async watch() {
    this.pages = await this.transformer.transform();
    for (const page of this.pages) {
      await this.createRoute(page);
    }
    this.content.watch().on('change', change => {
      if (change.operationType === 'replace' && change.fullDocument) {
        this.transformer.pushContent(change.fullDocument);
      }
    });
  }

  private async createRoute(page: RenderablePage) {
    const route: Route = { _id: page.url, url: page.url, tag: await page.compile() };
    await this.routes.replaceOne({ _id: page.url }, route, { upsert: true });
  }
}

export class Aetlan {
  public urls: Record<string, string> = {};
  private contentCache: Collection<PageData>;

  static async create(root: string, plugins: Plugin[]) {
    const store = await createStorageEngine();
    const db = await createDatabase(store, root);
    const handlers: FileHandler[] = [];
    for (const plugin of plugins) {
      handlers.push(...plugin.handlers);
    }

    return new Aetlan(root, handlers, db, store);
  }

  constructor(
    public readonly root: string,
    private handlers: FileHandler[],
    public db: Database,
    private store: StorageEngine,
  ) {
    this.contentCache = db.collection('pagecache');
  }

  async createDevWatcher() {
    const t = await this.createTransformer();
    return new DevWatcher(t, this.contentCache, this.db.collection('routes'));
  }

  async createTransformer() {
    return Transformer.initialize(await this.contentCache.find().toArray(), new ContentFactory(this.handlers));
  }

  createServer(server: http.Server) {
    return new TashmetServer(this.store, server);
  }

  async reloadContent(filePath: string) {
    const doc = await this.db.collection('pagesource').aggregate<PageData>()
      .match({ _id: filePath })
      .set({ ast: { $markdocToAst: '$body' }})
      .next();

    if (doc) {
      await this.contentCache.replaceOne({ _id: doc._id }, doc, { upsert: true });
    }
  }

  async loadAst() {
    await this.db.collection('pagesource').aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: 'pagecache' }
    ]).toArray();
  }

  findPages(filter: Filter<Document>) {
    return this.db.collection('pagecache').find(filter);
  }

  async css() {
    const cssProc = postcss([
      tailwind({
        config: path.join(this.root, 'tailwind.config.js'),
      })
    ]);

    const cssPath = path.join(this.root, 'src/main.css');
    const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to: path.join(this.root, 'out/main.css') });

    return css.css;
  }
}
