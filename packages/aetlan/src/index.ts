import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Document, Collection, Filter } from '@tashmet/tashmet';
import { terminal } from '@tashmet/terminal';
import TashmetServer from '@tashmet/server';
import { DocumentSource, Pipeline, RenderableDocument, Target, Transform, TransformContext } from "./interfaces";

import tailwind from 'tailwindcss';
import postcss from 'postcss';
import http from 'http';

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
    const componentItems = files.map(file => ({
      path: file,
      relPath: path.relative(root, file),
      name: path.basename(file, '.' + file.split('.').pop())
    }));

    /*
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

    */
    for (const [name, plugin] of Object.entries(this.plugins)) {
      await plugin.transform(this);
    }
    //await this.css(root);
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

    const files = await glob.glob(path.join(root, 'src/tags/**/*.jsx'));
    const componentItems = files.map(file => ({
      path: file,
      relPath: path.relative(root, file),
      name: path.basename(file, '.' + file.split('.').pop())
    }));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(root, 'src'), f)

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

      const root = ReactDOM.createRoot(container);
      root.render(<RouterProvider router={router} />);
    `;

    let ctx = await esbuild.context({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(root, 'src'),
      },
      bundle: true,
      outfile: path.join(root, 'out/app.js'),
    });

    logger.inScope('server').info("Starting server...");

    let { host, port } = await ctx.serve({
      servedir: path.join(root, 'out'),
    });

    // Then start a proxy server on port 3000
    const server = http.createServer((req, res) => {
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

    logger.inScope('server').info(`Website ready at 'http://localhost:${port}'`);
    new TashmetServer(this.store, server).listen();

    server.listen(3000);
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