import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Database, Filter, FindCursor, WithId, AggregationCursor } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';
import { DocumentSource, TransformContext } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import path from 'path';
import fs from 'fs';

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

//export class AetlanDevServer {
  //constructor(private db: Database) {}

  //async listen() {
    //await loadPageCache(this.db);
  //}
//}


//export interface Page {
  //filepath: string;

  //body: string;

  //ast: Document;

  //renderable: Document;

  //frontmatter: Document;

  ////schema: Document;
//}


//export async function loadPageCache(db: Database) {
  //await this.db.collection('pagesource').aggregate([
    //{ $set: { ast: { $markdocToAst: '$body' } } },
    //{ $out: 'pagecache' }
  //]).toArray();
//}

//export class AetlanClient {
  //constructor(private db: Database) {}

  ////output(filename: string, content: string) {

  ////}

  //findPages(filter: Filter<Page>): FindCursor<Page> {
    //return this.db
      //.collection<Page>('pagecache')
      //.find(filter);
  //}

  //aggregatePages(pipeline: Document[]): AggregationCursor<Page> {
    //return this.db
      //.collection<Page>('pagecache')
      //.aggregate(pipeline);
  //}

  //getPage(id: string) {
    //return this.db
      //.collection<Page>('pagecache')
      //.findOne({ _id: id });
  //}

  //async savePage(page: WithId<Page>) {
    //await this.db
      //.collection('pagefiles')
      //.replaceOne({ _id: page._id }, { _id: page._id, content: page.body }, { upsert: true });
  //}
//}

export class Aetlan implements TransformContext {
  public urls: Record<string, string> = {};

  static async create(root: string, plugins: Record<string, DocumentSource>) {
    const db = await createDatabase(root);

    return new Aetlan(root, plugins, db);
  }

  constructor(
    public readonly root: string,
    private plugins: Record<string, DocumentSource>,
    //public store: StorageEngine,
    public db: Database,
  ) {}

  async loadAst() {
    await this.db.collection('pagesource').aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: 'pagecache' }
    ]).toArray();
  }

  async url(path: string): Promise<string> {
    const page = await this.db.collection('pagecache').findOne({ path: path });
    if (page) {
      return this.plugins[page.frontmatter.type].url(page);
    }
    throw Error(`No page at path: ${path}`);
  }

  findPages(filter: Filter<Document>) {
    return this.db.collection('pagecache').find(filter);
  }

  async mount(slug: string, renderable: any) {
    //await this.db
      //.collection('renderable')
      //.replaceOne({ _id: slug }, { _id: slug, renderable }, { upsert: true });
  }

  //replacePage(ast: Document): Promise<void> {
    //return this.plugins[ast.frontmatter.type].update(ast, this);
  //}

  //slugify(doc: any) {
    //if (doc.frontmatter.slug) {
      //return path.join('/', doc.frontmatter.slug);
    //}
    //const relPath = doc.path;
    //let dirName = path.join('/', path.dirname(relPath));

    //if (relPath.endsWith('README.md') || relPath.endsWith('INDEX.md')) {
      //return dirName;
    //}

    //return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  //}

  async transform() {
    const pageCache = this.db.collection('pagecache');
    const routes = this.db.collection('routes');
    //let urls: Record<string, string> = {};

    for await (const doc of pageCache.find()) {
      this.urls[doc.path] = await this.url(doc.path);
    }

    for await (const doc of pageCache.find()) {
      const plugin = this.plugins[doc.frontmatter.type || 'page'];
      const renderable = await plugin.transform(doc, this.urls);
      await pageCache.updateOne({ _id: doc._id }, { $set: { renderable } });
    }

    for await (const doc of pageCache.find()) {
      const plugin = this.plugins[doc.frontmatter.type || 'page'];
      const url = plugin.url(doc);
      if (url) {
        const data = await plugin.data(doc, this);
        const renderable = { ...doc.renderable, attributes: data };
        const route = { _id: doc._id, url, renderable };
        await routes.replaceOne({ _id: doc._id }, route, { upsert: true });
      }
    }
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
