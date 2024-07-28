import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Database, Filter } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';
import { DocumentSource, TransformContext } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import path from 'path';
import fs from 'fs';

export class Aetlan implements TransformContext {
  static async create(root: string, plugins: Record<string, DocumentSource>) {
    const store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdocPlugin())
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

    return new Aetlan(plugins, store, pagesDb);
  }

  constructor(
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

  async transform() {
    for (const [name, plugin] of Object.entries(this.plugins)) {
      await plugin.transform(this);
    }
  }

  async css(root: string) {
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