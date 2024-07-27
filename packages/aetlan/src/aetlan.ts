import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Database, Filter } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';
import { DocumentSource, Pipeline, Target, TransformContext } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import mustache from './mustache.js';
import * as glob from 'glob';
import path from 'path';
import fs from 'fs';

export class Aetlan implements TransformContext {
  //public pagesDb: Database;

  private pipelines: Pipeline[] = [];
  //private tashmet: Tashmet;
  //private store: StorageEngine;

  pipeline(p: Pipeline) {
    this.pipelines.push(p);
    return this;
  }

  static async create(root: string, target: Target, plugins: Record<string, DocumentSource>) {
    const store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdocPlugin())
      .use(mustache())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());
    const pagesDb = tashmet.db('pages');
    const pagesPath = path.join(root, 'src/pages');

    await pagesDb.createCollection('source', {
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
    await pagesDb.createCollection('renderable');
    await pagesDb.createCollection('target', {
      storageEngine: {
        glob: {
          pattern: path.join(root, 'out', '**/*.html'),
          format: 'text',
        }
      }
    });

    return new Aetlan(target, plugins, store, pagesDb);
  }

  constructor(
    private target: Target,
    private plugins: Record<string, DocumentSource>,
    public store: StorageEngine,
    public pagesDb: Database,
  ) {}

  async loadAst() {
    await this.pagesDb.collection('source').aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: 'pages.ast' }
    ]).toArray();
  }

  findPages(filter: Filter<Document>) {
    return this.pagesDb.collection('ast').find(filter);
  }

  async mount(slug: string, renderable: any) {
    await this.pagesDb
      .collection('renderable')
      .replaceOne({ _id: slug }, { _id: slug, renderable }, { upsert: true });
  }

  replacePage(ast: Document): Promise<void> {
    return this.plugins[ast.frontmatter.type].update(ast, this);
  }

  async buildComponent(fileName: string) {
    const logger = this.store.logger;
    const p = path.basename(fileName, '.' + fileName.split('.').pop())
    logger.inScope('build').info(`read: '${p}'`);
    await this.target.component(p, fileName, true);
  }

  slugify(doc: any) {
    if (doc.frontmatter.slug) {
      return path.join('/', doc.frontmatter.slug);
    }
    const relPath = doc.path;
    let dirName = path.join('/', path.dirname(relPath));

    if (relPath.endsWith('README.md') || relPath.endsWith('INDEX.md')) {
      return dirName;
    }

    return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  }

  async run(root: string) {
    await this.loadAst();
    await this.transform();

    const files = await glob.glob(path.join(root, 'src/tags/**/*.jsx'));
    const componentItems = files.map(file => ({
      path: file,
      relPath: path.relative(root, file),
      name: path.basename(file, '.' + file.split('.').pop())
    }));

    const logger = this.store.logger;
    for (const { name, path } of componentItems) {
      logger.inScope('build').info(`read: '${path}'`);
      await this.target.component(name, path, true);
    }

    const cs = this.pagesDb.collection('renderable').watch();
    cs.on('change', async change => {
      for (const [tName, t] of Object.entries(this.target.transforms)) {
        const doc = change.fullDocument;
        if (doc) {
          const { path, content } = await t(doc as any);
          logger.inScope(tName).info(`write: '${path}'`);
          await this.pagesDb.collection('target').replaceOne({ _id: path }, { _id: path, content }, { upsert: true });
        }
      }
    });

    await this.css(root);
  }

  async transform() {
    for (const [name, plugin] of Object.entries(this.plugins)) {
      await plugin.transform(this);
    }
  }

  private async css(root: string) {
    const cssProc = postcss([
      tailwind({
        config: path.join(root, 'tailwind.config.js'),
      })
    ]);

    const cssPath = path.join(root, 'src/main.css');
    const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to: path.join(root, 'out/main.css') });

    fs.writeFileSync(css.opts.to as string, css.css);
  }
}