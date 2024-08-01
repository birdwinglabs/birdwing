import TashmetServer from '@tashmet/server';

import http from 'http';
import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { Aetlan } from '../aetlan.js';
import { Collection } from '@tashmet/tashmet';


export class DevServer {
  private targetFiles: Collection;

  constructor(private aetlan: Aetlan) {
  }

  async run() {
    this.targetFiles = await this.aetlan.pagesDb.createCollection('devtarget');

    const pageWatcher = chokidar.watch(path.join(this.aetlan.root, 'src/pages/**/*.md'));
    const srcWatcher = chokidar.watch(path.join(this.aetlan.root, 'src/**/*.jsx'));

    await this.aetlan.loadAst();
    await this.aetlan.transform();

    pageWatcher.on('change', async filePath => {
      const doc = await this.aetlan.pagesDb.collection('source').aggregate()
        .match({ _id: filePath })
        .set({ ast: { $markdocToAst: '$body' }})
        .next();

      if (doc) {
        this.aetlan.pagesDb.collection('ast').replaceOne({ _id: doc._id }, doc, { upsert: true });
      }
    });

    const astChangeStream = this.aetlan.pagesDb.collection('ast').watch();
    astChangeStream.on('change', async change => {
      if (change.operationType === 'replace') {
        const doc = change.fullDocument;

        if (doc) {
          await this.aetlan.replacePage(doc);
        }
      }
    });

    const files = await glob.glob(path.join(this.aetlan.root, 'src/tags/**/*.jsx'));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.aetlan.root, 'src'), f)

      return { name, file };
    });

    const code = `
      import App from '@aetlan/dev';
      import React from 'react';
      import ReactDOM from 'react-dom/client';
      import { createBrowserRouter, RouterProvider } from "react-router-dom";
      ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

      const components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };

      const container = document.getElementById('app');

      const router = createBrowserRouter([{
        path: '*',
        element: <App components={components}/>
      }]);

      ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
    `;

    let ctx = await esbuild.context({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(this.aetlan.root, 'src'),
      },
      bundle: true,
      outfile: path.join(this.aetlan.root, 'out/client.js'),
      write: false,
    });

    srcWatcher.on('change', async () => {
      await this.rebuild(ctx);
    });

    await this.rebuild(ctx);

    this.aetlan.store.logger.inScope('server').info("Starting server...");

    const port = 3000;
    const server = this.createServer();

    this.aetlan.store.logger.inScope('server').info(`Website ready at 'http://localhost:${port}'`);
    new TashmetServer(this.aetlan.store, server).listen();

    server.listen(port);
  }

  private async rebuild(ctx: esbuild.BuildContext) {
    this.aetlan.store.logger.inScope('server').info("Building...");

    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.updateFile('/app.js', buildRes.outputFiles[0].text);
    }
    await this.updateFile('/main.css', await this.aetlan.css());

    this.aetlan.store.logger.inScope('server').info("Done");
  }

  private async updateFile(name: string, content: string) {
    await this.targetFiles.replaceOne({ _id: name }, { _id: name, content }, { upsert: true });
  }

  private createServer() {
    return http.createServer(async (req, res) => {
      const url = req.url || '';
      const doc = await this.aetlan.pagesDb
        .collection('renderable')
        .findOne({ _id: url !== '/' ? url.replace(/\/$/, "") : url });

      if (doc) {
        var stream = fs.createReadStream(path.join(this.aetlan.root, 'src/main.html'));
        stream.pipe(res);
      } else {
        const file = await this.targetFiles.findOne({ _id: req.url });
        if (file) {
          res.write(file.content);
          res.end();
        }
      }
    });
  }
}
