import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Database, Filter, Collection } from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';
import { Page, PageData, Plugin, Route, Fragment, FileHandler, PageFileHandler, FragmentFileHandler } from "./interfaces.js";
import minimatch from 'minimatch';

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import path from 'path';
import fs from 'fs';
import markdoc from "@markdoc/markdoc";

const { Tag } = markdoc;

async function createDatabase(root: string) {
  const store = Nabu
    .configure({
      logLevel: LogLevel.Info,
      logFormat: terminal(),
    })
    .use(mingo())
    .use(markdocPlugin())
    .bootstrap();

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

export class Aetlan {
  public urls: Record<string, string> = {};
  private contentCache: Collection<PageData>;

  static async create(root: string, plugins: Plugin[]) {
    const db = await createDatabase(root);
    const handlers: FileHandler[] = [];
    for (const plugin of plugins) {
      handlers.push(...plugin.handlers);
    }

    return new Aetlan(root, handlers, db);
  }

  constructor(
    public readonly root: string,
    private handlers: FileHandler[],
    public db: Database,
  ) {
    this.contentCache = db.collection('pagecache');
  }

  async reloadContent(filePath: string) {
    const doc = await this.db.collection('source').aggregate<PageData>()
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

  private getFileHandler(content: PageData): FileHandler | null {
    for (const handler of this.handlers) {
      if (minimatch(content.path, handler.glob)) {
        return handler;
      }
    }
    return null;
  }

  async createPages(): Promise<Page[]> {
    const pages: Page[] = [];

    for await (const content of this.contentCache.find()) {
      const handler = this.getFileHandler(content);

      if (handler instanceof PageFileHandler) {
        pages.push(await handler.createPage(content));
      }
    }
    return pages;
  }

  async createFragments(urls: Record<string, string>): Promise<Fragment[]> {
    const fragments: Fragment[] = [];

    for await (const content of this.contentCache.find()) {
      const handler = this.getFileHandler(content);

      if (handler instanceof FragmentFileHandler) {
        fragments.push(await handler.createFragment(content, urls));
      }
    }
    return fragments;
  }

  async transform() {
    function isSubPath(dir: string, root: string) {
      const relative = path.relative(root, dir);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    const pages = await this.createPages();
    const routes: Route[] = [];

    const urls = pages.reduce((urls, page) => {
      urls[page.path] = page.url || '';
      return urls;
    }, {} as Record<string, string>);


    const fragments = await this.createFragments(urls);

    for (const page of pages) {
      const f = fragments.reduce((obj, f) => {
        if (isSubPath(page.path, f.path)) {
          obj[f.name] = f;
        }
        return obj;
      }, {} as Record<string, Fragment>);

      const data = await page.data(f);

      const renderable = page.transform(urls);
      if (renderable instanceof Tag) {
        const tag = { ...renderable, attributes: data };
        routes.push({ url: page.url, tag })
      }
    }
    return routes;
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
