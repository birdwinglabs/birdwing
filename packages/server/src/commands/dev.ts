import http from 'http';
import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';
import { AetlanConfig } from '@aetlan/aetlan/dist/aetlan.js';

export class DevServer {
  constructor(
    private aetlan: Aetlan,
    private store: StorageEngine,
    private root: string
  ) {
  }

  static async create(root: string, config: AetlanConfig) {
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), config);

    return new DevServer(aetlan, store, root);
  }

  async run() {
    const contentWatcher = chokidar.watch(path.join(this.root, '**/*.md'));
    const srcWatcher = chokidar.watch(path.join(this.root, 'theme/**/*.jsx'));

    const compileCtx = await this.aetlan.watch();

    compileCtx.on('route-compiled', route => {
      this.aetlan.store.updateRoute(route)
    });
    compileCtx.transform();

    contentWatcher.on('change', async filePath => {
      await this.aetlan.store.reloadContent(path.relative(this.root, filePath));
    });

    const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));
    const code = this.createClientCode(files);

    let ctx = await esbuild.context({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(this.root, 'theme'),
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
      const file = path.relative(path.join(this.root, 'theme'), f)

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
      await this.aetlan.store.write('/app.js', buildRes.outputFiles[0].text);
    }
    await this.aetlan.store.write('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));

    this.store.logger.inScope('server').info("Done");
  }

  private createServer() {
    return http.createServer(async (req, res) => {
      const url = req.url || '';
      const route = await this.aetlan.store.getRoute(url);

      if (route) {
        var stream = fs.createReadStream(path.join(this.root, 'theme/main.html'));
        stream.pipe(res);
      } else {
        const content = await this.aetlan.store.getOutput(req.url || '');
        res.write(content || '');
        res.end();
      }
    });
  }
}
