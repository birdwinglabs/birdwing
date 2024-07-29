import TashmetServer from '@tashmet/server';

import http from 'http';
import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { Aetlan } from '../aetlan.js';


export class DevServer {
  constructor(private aetlan: Aetlan) {}

  async run() {
    const pageWatcher = chokidar.watch(path.join(this.aetlan.root, 'src/pages/**/*.md'));

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

      ReactDOM.hydrateRoot(container, <RouterProvider router={router} />);
    `;

    let ctx = await esbuild.context({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(this.aetlan.root, 'src'),
      },
      bundle: true,
      outfile: path.join(this.aetlan.root, 'out/app.js'),
    });

    this.aetlan.store.logger.inScope('server').info("Starting server...");

    let { host, port } = await ctx.serve({
      servedir: path.join(this.aetlan.root, 'out'),
    });
    const server = this.createServer(host, port);
    const proxyPort = 3000;

    this.aetlan.store.logger.inScope('server').info(`Website ready at 'http://localhost:${proxyPort}'`);
    new TashmetServer(this.aetlan.store, server).listen();

    server.listen(proxyPort);
  }

  private createServer(host: string, port: number) {
    return http.createServer((req, res) => {
      const options = {
        hostname: host,
        port: port,
        path: req.url,
        method: req.method,
        headers: req.headers,
      }

      // Forward each incoming request to esbuild
      const proxyReq = http.request(options, proxyRes => {
        // If esbuild returns "not found", send a custom 404 page
        if (proxyRes.statusCode === 404) {
          res.writeHead(404, { 'Content-Type': 'text/html' })
          res.end('<h1>A custom 404 page</h1>')
          return
        }

        // Otherwise, forward the response from esbuild to the client
        res.writeHead(proxyRes.statusCode || 0, proxyRes.headers)
        proxyRes.pipe(res, { end: true })
      })

      // Forward the body of the request to esbuild
      req.pipe(proxyReq, { end: true })
    });
  }
}
