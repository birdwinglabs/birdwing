import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Collection } from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';
import { Pipeline, RenderableDocument, Transform } from "./interfaces";

import markdocPlugin from './markdoc.js';
import mustache from './mustache.js';

export * from './interfaces.js';

export class Aetlan {
  private pipelines: Pipeline[] = [];
  private tashmet: Tashmet;

  private output: Collection;

  pipeline(p: Pipeline) {
    this.pipelines.push(p);
  }

  async run() {
    const store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdocPlugin())
      .use(mustache())
      .bootstrap();

    this.tashmet = await Tashmet.connect(store.proxy());

    this.output = await this.tashmet.db('aetlan').createCollection('output');

    for (const pipe of this.pipelines) {
      await pipe.target.compile();
      await pipe.source.create(pipe.name, this.tashmet);
      const docs = await pipe.source.read();
      await this.transform(docs, pipe.target.transforms);
    }
  }

  //async watch() {
    //await this.build();

    //const watcher = chokidar.watch(path.join(this.srcPath, '**/*.md'));

    //watcher.on('change', async filePath => {
      //const relPath = path.relative(this.srcPath, filePath);
      //const docs = await this.documents(relPath);
      //await this.transform(docs);
    //});
  //}

  private async transform(docs: RenderableDocument[], transforms: Record<string, Transform>) {
    await this.output.deleteMany({});

    for (const [name, t] of Object.entries(transforms)) {
      for (const doc of docs) {
        const res = await t(doc);
        await this.output.insertOne({...res, scope: name});
      }
    }

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