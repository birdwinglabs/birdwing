import http from 'http';
import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';
import { JSDOM } from 'jsdom';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';
import { loadConfig } from '../config.js';
import { configureSvelte } from '../builders/svelte.js';
import { configureDevClient } from '../builders/devclient.js';

export class DevServer {
  constructor(
    private aetlan: Aetlan,
    private store: StorageEngine,
    private root: string
  ) {
  }

  static async configure(configFile: string) {
    const config = await loadConfig(configFile);
    const root = path.dirname(configFile);
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), config);

    return new DevServer(aetlan, store, root);
  }

  async run() {
    const tagsGlob = path.join(this.root, 'theme/tags/**/*.jsx');
    const jsxGlob = path.join(this.root, 'theme/**/*.jsx');
    const clientGlob = path.join(this.root, 'theme/client/**/*.svelte');
    const contentGlob = path.join(this.root, '**/*.md');

    const contentWatcher = chokidar.watch(contentGlob);
    const jsxWatcher = chokidar.watch(jsxGlob);
    const svelteWatcher = chokidar.watch(clientGlob);

    const compileCtx = await this.aetlan.watch();

    compileCtx.on('route-compiled', route => {
      this.aetlan.store.updateRoute(route)
    });
    compileCtx.transform();

    contentWatcher.on('change', async filePath => {
      await this.aetlan.store.reloadContent(path.relative(this.root, filePath));
    });

    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
    const clientCtx = await esbuild.context(configureSvelte(this.root, await glob.glob(clientGlob), 'theme'));

    jsxWatcher.on('change', async () => {
      await this.rebuildDev(devCtx);
    });
    svelteWatcher.on('change', async () => {
      // TODO: Currently breaks the UI. need to figure out why.
      //await this.rebuildClient(devCtx);
    });

    await this.rebuildDev(devCtx);
    await this.rebuildClient(clientCtx);


    const html = this.createHtml();
    await this.aetlan.store.write('/main.html', html);

    this.store.logger.inScope('server').info("Starting server...");

    const port = 3000;
    const server = this.createServer();

    this.store.logger.inScope('server').info(`Website ready at 'http://localhost:${port}'`);
    new TashmetServer(this.store, server).listen();

    server.listen(port);
  }

  private createHtml() {
    const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();
    const dom = new JSDOM(html);

    const clientScriptElem = dom.window.document.createElement('script');
    clientScriptElem.setAttribute('type', 'module');
    clientScriptElem.setAttribute('src', '/client.js');
    dom.window.document.body.appendChild(clientScriptElem);

    const devScriptElem = dom.window.document.createElement('script');
    devScriptElem.setAttribute('src', '/dev.js');
    dom.window.document.body.appendChild(devScriptElem);

    return dom.serialize();
  }

  private async rebuildDev(ctx: esbuild.BuildContext) {
    this.store.logger.inScope('server').info("Building React...");

    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.aetlan.store.write('/dev.js', buildRes.outputFiles[0].text);
    }
    await this.aetlan.store.write('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));

    this.store.logger.inScope('server').info("Done");
  }

  private async rebuildClient(ctx: esbuild.BuildContext) {
    this.store.logger.inScope('server').info("Building Svelte...");

    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.aetlan.store.write('/client.js', buildRes.outputFiles[0].text);
    }
    await this.aetlan.store.write('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));

    this.store.logger.inScope('server').info("Done");
  }

  private createServer() {
    return http.createServer(async (req, res) => {
      const url = req.url || '';
      const route = await this.aetlan.store.getRoute(url);

      if (route) {
        const content = await this.aetlan.store.getOutput('/main.html');
        res.setHeader('Content-Type', 'text/html');
        res.write(content || '');
        res.end();
      } else {
        const content = await this.aetlan.store.getOutput(req.url || '');
        if (req.url?.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript')
        }
        res.write(content || '');
        res.end();
      }
    });
  }
}
