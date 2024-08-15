import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Database, Filter, Collection, ChangeStream } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';
import { Page, PageData, Plugin, Route, Fragment, FileHandler, PageFileHandler, FragmentFileHandler } from "./interfaces.js";
import minimatch from 'minimatch';
import TashmetServer from '@tashmet/server';
import http from 'http';

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import path from 'path';
import fs from 'fs';
import markdoc from "@markdoc/markdoc";

const { Tag } = markdoc;

async function createStorageEngine() {
  return Nabu
    .configure({
      logLevel: LogLevel.Info,
      logFormat: terminal(),
    })
    .use(mingo())
    .use(markdocPlugin())
    .bootstrap();
}

async function createDatabase(store: StorageEngine, root: string) {
  const tashmet = await Tashmet.connect(store.proxy());
  const db = tashmet.db('aetlan');
  const pagesPath = path.join(root, 'src/pages');

  await db.createCollection('pagesource', {
    storageEngine: {
      glob: {
        pattern: path.join(pagesPath, '**/*.md'),
        format: {
          frontmatter: {
            format: 'yaml',
          }
        },
        construct: {
          path: {
            $relativePath: [pagesPath, '$_id']
          }
        },
      }
    }
  });
  await db.createCollection('pagecache');
  await db.createCollection('routes');
  await db.createCollection('devtarget');
  await db.createCollection('buildtarget', {
    storageEngine: {
      glob: {
        pattern: path.join(root, 'out', '**/*'),
        format: 'text',
      }
    }
  });

  return db;
}

export class ContentFactory {
  constructor(private handlers: FileHandler[]) {}

  async createContent(doc: PageData, urls: Record<string, string>): Promise<Page | Fragment | null> {
    const handler = this.getFileHandler(doc);

    if (handler instanceof PageFileHandler) {
      return handler.createPage(doc);
    } else if (handler instanceof FragmentFileHandler) {
      return handler.createFragment(doc, urls);
    }
    return null;
  }

  async createPages(documents: PageData[]): Promise<Page[]> {
    const pages: Page[] = [];

    for (const doc of documents) {
      const handler = this.getFileHandler(doc);

      if (handler instanceof PageFileHandler) {
        pages.push(await handler.createPage(doc));
      }
    }
    return pages;
  }

  async createFragments(documents: PageData[], urls: Record<string, string>): Promise<Fragment[]> {
    const fragments: Fragment[] = [];

    for (const doc of documents) {
      const handler = this.getFileHandler(doc);

      if (handler instanceof FragmentFileHandler) {
        fragments.push(await handler.createFragment(doc, urls));
      }
    }
    return fragments;
  }

  private getFileHandler(content: PageData): FileHandler | null {
    for (const handler of this.handlers) {
      if (minimatch(content.path, handler.glob)) {
        return handler;
      }
    }
    return null;
  }
}

export class Transformer {
  constructor(
    private content: Collection<PageData>,
    private routes: Collection<Route>,
    private contentFactory: ContentFactory,
    private urls: Record<string, string>,
    private fragments: Fragment[] = [],
    private pages: Page[] = [],
  ) {
    content.watch().on('change', change => {
      if (change.operationType === 'replace' && change.fullDocument) {
        this.onContentReplaced(change.fullDocument);
      }
    });

    routes.watch().on('change', change => {
      console.log(change);
    });
  }

  static async initialize(
    content: Collection<PageData>,
    routes: Collection<Route>,
    contentFactory: ContentFactory,
  ) {
    const contentDocs = await content.find().toArray();

    const pages = await contentFactory.createPages(contentDocs);
    const urls = pages.reduce((urls, page) => {
      urls[page.path] = page.url || '';
      return urls;
    }, {} as Record<string, string>);

    const fragments = await contentFactory.createFragments(contentDocs, urls);

    return new Transformer(content, routes, contentFactory, urls, fragments, pages);
  }

  private async onContentReplaced(content: PageData) {
    const pageOrFragment = await this.contentFactory.createContent(content, this.urls);

    if (pageOrFragment instanceof Page) {
      await this.transformPage(pageOrFragment);
    }
  }

  private getPageData(page: Page) {
    function isSubPath(dir: string, root: string) {
      const relative = path.relative(root, dir);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    const f = this.fragments.reduce((obj, f) => {
      if (isSubPath(page.path, f.path)) {
        obj[f.name] = f;
      }
      return obj;
    }, {} as Record<string, Fragment>);

    return page.data(f);
  }

  async transform() {
    for (const page of this.pages) {
      await this.transformPage(page);
    }
    return this.routes.find().toArray();
  }

  private async transformPage(page: Page) {
    const data = await this.getPageData(page);

    const renderable = page.transform(this.urls);
    if (renderable instanceof Tag) {
      const tag = { ...renderable, attributes: data };
      const route = { _id: page.id, url: page.url, tag };
      await this.routes.replaceOne({ _id: page.id }, route, { upsert: true });
    }
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

  createTransformer() {
    return Transformer.initialize(this.contentCache, this.db.collection('routes'), new ContentFactory(this.handlers));
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
