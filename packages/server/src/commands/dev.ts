import http from 'http';
import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan, Fragment, PageData, Plugin, RenderablePage, Transformer, ContentFactory, createFileHandlers } from '@aetlan/aetlan';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';


export class DevContentWatcher {
  private pages: RenderablePage[] = [];

  constructor(
    private transformer: Transformer,
    private aetlan: Aetlan
  ) {
    transformer.on('page-updated', async (page: RenderablePage) => {
      await this.aetlan.updateRoute(page);
    });
    transformer.on('fragment-updated', async (fragment: Fragment) => {
      for (const page of this.pages) {
        await this.aetlan.updateRouteAttributes(page);
      }
    });
    transformer.on('fragment-added', (fragment: Fragment) => {
    });
  }

  async watch() {
    this.pages = await this.transformer.transform();
    for (const page of this.pages) {
      await this.aetlan.updateRoute(page);
    }
    this.aetlan.on('content-changed', (content: PageData) => {
      this.transformer.pushContent(content);
    });
  }
}

export class DevServer {
  constructor(
    private aetlan: Aetlan,
    private watcher: DevContentWatcher,
    private store: StorageEngine,
    private root: string
  ) {
  }

  static async create(root: string, plugins: Plugin[]) {
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, true);
    const handlers = createFileHandlers(plugins);

    const aetlan = await Aetlan.load(db);
    const transformer = await Transformer.initialize(
      await aetlan.findContent({}).toArray(), new ContentFactory(handlers)
    );
    const contentWatcher = new DevContentWatcher(transformer, aetlan);

    return new DevServer(aetlan, contentWatcher, store, root);
  }

  async run() {
    const pageWatcher = chokidar.watch(path.join(this.root, 'src/pages/**/*.md'));
    const srcWatcher = chokidar.watch(path.join(this.root, 'src/**/*.jsx'));

    await this.watcher.watch();

    pageWatcher.on('change', async filePath => {
      await this.aetlan.reloadContent(filePath);
    });

    const files = await glob.glob(path.join(this.root, 'src/tags/**/*.jsx'));
    const code = this.createClientCode(files);

    let ctx = await esbuild.context({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(this.root, 'src'),
      },
      bundle: true,
      outfile: path.join(this.root, 'out/client.js'),
      write: false,
    });

    srcWatcher.on('change', async () => {
      await this.rebuild(ctx);
    });

    await this.rebuild(ctx);

    this.store.logger.inScope('server').info("Starting server...");

    const port = 3000;
    const server = this.createServer();

    this.store.logger.inScope('server').info(`Website ready at 'http://localhost:${port}'`);
    new TashmetServer(this.store, server).listen();

    server.listen(port);
  }

  private createClientCode(jsxFiles: string[]) {
    const imports = jsxFiles.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.root, 'src'), f)

      return { name, file };
    });

    return `
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
  }

  private async rebuild(ctx: esbuild.BuildContext) {
    this.store.logger.inScope('server').info("Building...");

    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.aetlan.write('/app.js', buildRes.outputFiles[0].text);
    }
    await this.aetlan.write('/main.css', await generateCss(this.root));

    this.store.logger.inScope('server').info("Done");
  }

  private createServer() {
    return http.createServer(async (req, res) => {
      const url = req.url || '';
      const route = await this.aetlan.getRoute(url);

      if (route) {
        var stream = fs.createReadStream(path.join(this.root, 'src/main.html'));
        stream.pipe(res);
      } else {
        const content = await this.aetlan.getOutput(req.url || '');
        res.write(content || '');
        res.end();
      }
    });
  }
}
