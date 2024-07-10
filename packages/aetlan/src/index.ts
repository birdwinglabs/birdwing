import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Collection } from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';
import { Pipeline, RenderableDocument, Transform } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';

import markdocPlugin from './markdoc.js';
import mustache from './mustache.js';
import * as glob from 'glob';
import path from 'path';
import fs from 'fs';
import * as chokidar from 'chokidar';

export * from './interfaces.js';

export class Aetlan {
  private pipelines: Pipeline[] = [];
  private tashmet: Tashmet;
  private store: Nabu;

  private output: Collection;

  pipeline(p: Pipeline) {
    this.pipelines.push(p);
    return this;
  }

  constructor() {
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

  async run(root: string) {
    this.tashmet = await Tashmet.connect(this.store.proxy());

    this.output = await this.tashmet.db('aetlan').createCollection('output');
    await this.output.deleteMany({});

    for (const { name, source, target, components, postrender } of this.pipelines) {
      const logger = this.store.logger.inScope(name);
      logger.info('running pipe');

      const files = await glob.glob(path.join(root, components));
      const componentItems = files.map(file => ({ path: file, name: path.basename(file, '.' + file.split('.').pop()) }));

      for (const { name, path } of componentItems) {
        const prerender = !postrender.includes(name);
        logger.inScope(prerender ? 'rollup' : 'import').info(`read: '${path}'`);
        await target.component(name, path, prerender);
      }

      await source.create(name, this.tashmet);
      const docs = await source.read(componentItems.map(c => c.name));
      await this.transform(docs, target.transforms);
    }

    await this.css(root);
    await this.write();
  }

  async watch(root: string) {
    await this.run(root);

    for (const pipe of this.pipelines) {
      const markdocWatcher = chokidar.watch(path.join(pipe.source.path, '**/*.md'));
      const srcWatcher = chokidar.watch(path.join(root, pipe.components));
      const logger = this.store.logger.inScope(pipe.name);

      srcWatcher.on('change', async file => { 
        const item = { path: file, name: path.basename(file, '.' + file.split('.').pop()) };
        logger.info(`rollup: '${item.path}'`);
        await pipe.target.component(item.name, item.path, false);
        const docs = await pipe.source.read([]);
        await this.output.deleteMany({});
        await this.transform(docs, pipe.target.transforms);
        await this.css(root);
        await this.write();
      });

      markdocWatcher.on('change', async filePath => {
        const relPath = path.relative(pipe.source.path, filePath);
        await this.output.deleteMany({});
        const docs = await pipe.source.read([], relPath);
        await this.transform(docs, pipe.target.transforms);
        await this.write();
      });
    }
  }

  private async css(root: string) {
    const cssProc = postcss([
      tailwind({
        config: path.join(root, 'tailwind.config.js'),
      })
    ]);

    const cssPath = path.join(root, 'src/main.css');
    const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath });

    await this.output.insertOne({
      scope: 'css',
      content: css.css,
      path: path.join(root, 'out/main.css'),
    });
  }

  private async transform(docs: RenderableDocument[], transforms: Record<string, Transform>) {
    for (const [name, t] of Object.entries(transforms)) {
      for (const doc of docs) {
        const res = await t(doc);
        await this.output.insertOne({...res, scope: name});
      }
    }
  }

  private async write() {
    await this.output.aggregate([
      { $sort: { scope: 1 } },
      { $log: { scope: '$scope', message: { $concat: ["write: '", "$path", "'"] } } },
      {
        $writeFile: {
          content: '$content',
          to: '$path',
        }
      }
    ]).toArray();
  }
}