import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Collection, Filter } from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';
import { DocumentSource, Pipeline, RenderableDocument, Target, Transform, TransformContext } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import mustache from './mustache.js';
import * as glob from 'glob';
import path from 'path';
import fs from 'fs';
import * as chokidar from 'chokidar';

import * as esbuild from 'esbuild'

export * from './interfaces.js';
export * from './nodes.js';

export class Aetlan implements TransformContext {
  private pipelines: Pipeline[] = [];
  private tashmet: Tashmet;
  private store: Nabu;

  pipeline(p: Pipeline) {
    this.pipelines.push(p);
    return this;
  }

  constructor(private target: Target, private plugins: Record<string, DocumentSource>) {
    this.store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdocPlugin())
      .use(mustache())
      .bootstrap();
  }

  findPages(filter: Filter<Document>) {
    return this.tashmet.db('pages').collection('ast').find(filter);
  }

  async mount(slug: string, renderable: any) {
    await this.tashmet
      .db('pages')
      .collection('renderable')
      .replaceOne({ _id: slug }, { _id: slug, renderable }, { upsert: true });
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
    const pagesPath = path.join(root, 'src/pages');

    this.tashmet = await Tashmet.connect(this.store.proxy());
    const pagesSource = await this.tashmet.db('pages').createCollection('source', {
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
    const pagesRenderable = await this.tashmet.db('pages').createCollection('renderable');
    const pagesTarget = await this.tashmet.db('pages').createCollection('target', {
      storageEngine: {
        glob: {
          pattern: path.join(root, 'out', '**/*.html'),
          format: 'text',
        }
      }
    });

    await pagesSource.aggregate([
      { $set: { ast: { $markdocToAst: '$body' } } },
      { $out: 'pages.ast' }
    ]).toArray();

    const files = await glob.glob(path.join(root, 'src/tags/**/*.jsx'));
    const componentItems = files.map(file => ({ path: file, name: path.basename(file, '.' + file.split('.').pop()) }));

    const logger = this.store.logger;
    for (const { name, path } of componentItems) {
      logger.inScope('build').info(`read: '${path}'`);
      await this.target.component(name, path, true);
    }

    const cs = pagesRenderable.watch();
    cs.on('change', async change => {
      for (const [tName, t] of Object.entries(this.target.transforms)) {
        const doc = change.fullDocument;
        if (doc) {
          const { path, content } = await t(doc as RenderableDocument);
          logger.inScope(tName).info(`write: '${path}'`);
          await pagesTarget.replaceOne({ _id: path }, { _id: path, content }, { upsert: true });
        }
      }
    });

    for (const [name, plugin] of Object.entries(this.plugins)) {
      await plugin.transform(this);
    }
    await this.css(root);

    //this.output = await this.tashmet.db('aetlan').createCollection('output');
    //await this.output.deleteMany({});

    //for (const { name, source, target, components, postrender } of this.pipelines) {
      //const logger = this.store.logger.inScope(name);
      //logger.info('running pipe');

      //const files = await glob.glob(path.join(root, components));
      //const componentItems = files.map(file => ({ path: file, name: path.basename(file, '.' + file.split('.').pop()) }));

      //for (const { name, path } of componentItems) {
        //const prerender = !postrender.includes(name);
        //logger.inScope(prerender ? 'rollup' : 'import').info(`read: '${path}'`);
        //await target.component(name, path, prerender);
      //}

      //await source.create(name, this.tashmet);
      //const docs = await source.read(componentItems.map(c => c.name));
      //await this.transform(docs, target.transforms);
    //}

    //await this.css(root);
    //await this.write();
  }

  async watch(root: string) {
    await this.run(root);
    
    const pageWatcher = chokidar.watch(path.join(root, 'src/pages/**/*.md'));
    const srcWatcher = chokidar.watch(path.join(root, 'src/tags/**/*.jsx'));

    pageWatcher.on('change', async filePath => {
      const doc = await this.tashmet.db('pages').collection('source').aggregate()
        .match({ _id: filePath })
        .set({ ast: { $markdocToAst: '$body' }})
        .next();

      if (doc) {
        this.tashmet.db('pages').collection('ast').replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
    });

    const astChangeStream = this.tashmet.db('pages').collection('ast').watch();
    astChangeStream.on('change', async change => {
      if (change.operationType === 'replace') {
        const doc = change.fullDocument;

        if (doc) {
          await this.plugins[doc.frontmatter.type].update(doc, this);
        }
      }
    });


    const logger = this.store.logger;
    srcWatcher.on('change', async fileName => {
      const p = path.basename(fileName, '.' + fileName.split('.').pop())
      logger.inScope('build').info(`read: '${p}'`);
      await this.target.component(p, fileName, true);
    });

    let ctx = await esbuild.context({
      entryPoints: [path.join(root, 'src/app.jsx')],
      outdir: path.join(root, 'out'),
      bundle: true,
    });

    logger.inScope('server').info("Starting server...");

    let { port } = await ctx.serve({
      servedir: path.join(root, 'out'),
    });

    logger.inScope('server').info(`Website ready at 'http://localhost:${port}'`);

    //for (const pipe of this.pipelines) {
      //const markdocWatcher = chokidar.watch(path.join(pipe.source.path, '**/*.md'));
      //const srcWatcher = chokidar.watch(path.join(root, pipe.components));
      //const logger = this.store.logger.inScope(pipe.name);

      //srcWatcher.on('change', async file => { 
        //const item = { path: file, name: path.basename(file, '.' + file.split('.').pop()) };
        //logger.info(`rollup: '${item.path}'`);
        //await pipe.target.component(item.name, item.path, false);
        //const docs = await pipe.source.read([]);
        //await this.output.deleteMany({});
        //await this.transform(docs, pipe.target.transforms);
        //await this.css(root);
        //await this.write();
      //});

      //markdocWatcher.on('change', async filePath => {
        //const relPath = path.relative(pipe.source.path, filePath);
        //await this.output.deleteMany({});
        //const docs = await pipe.source.read([], relPath);
        //await this.transform(docs, pipe.target.transforms);
        //await this.write();
      //});
    //}
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