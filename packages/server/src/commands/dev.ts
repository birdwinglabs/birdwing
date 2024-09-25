import http from 'http';
import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';
import { JSDOM } from 'jsdom';
import { consola } from 'consola';
import { colorize } from 'consola/utils';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';
import { loadThemeConfig } from '../config.js';
import { configureSvelte } from '../builders/svelte.js';
import { configureDevClient } from '../builders/devclient.js';
import ora from 'ora';




export class DevServer {
  private started: boolean = false;

  constructor(
    private aetlan: Aetlan,
    private store: StorageEngine,
    private root: string
  ) {
  }

  static async configure(configFile: string) {
    const config = await loadThemeConfig(configFile);
    const root = path.dirname(configFile);
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), config);

    return new DevServer(aetlan, store, root);
  }

  async run() {
    console.log("Development server:\n");
    const spinner = ora({ indent: 2 });

    const tagsGlob = path.join(this.root, 'theme/tags/**/*.jsx');
    const jsxGlob = path.join(this.root, 'theme/**/*.jsx');
    const clientGlob = path.join(this.root, 'theme/client/**/*.svelte');
    const contentGlob = path.join(this.root, '**/*.md');

    const contentWatcher = chokidar.watch(contentGlob);
    const jsxWatcher = chokidar.watch(jsxGlob);
    const svelteWatcher = chokidar.watch(clientGlob);

    spinner.start("Compiling routes...");
    const compileCtx = await this.aetlan.watch();

    compileCtx.on('route-compiled', route => {
      this.aetlan.store.updateRoute(route)
    });
    compileCtx.on('done', routes => {
      if (this.started) {
        spinner.succeed(`${spinner.text}, ${colorize('blue', routes.length)} Routes updated`);
        spinner.start("Watching for file changes...");
      }
    })
    compileCtx.transform();

    spinner.succeed("Compiled routes");

    contentWatcher.on('change', async filePath => {
      const relPath = path.relative(this.root, filePath);
      //consola.info('File changed: `%s`', relPath)
      spinner.start(`Content changed: ${colorize('blue', relPath)}`);
      await this.aetlan.store.reloadContent(relPath);
    });

    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
    const clientCtx = await esbuild.context(configureSvelte(this.root, await glob.glob(clientGlob), 'theme'));

    jsxWatcher.on('change', async filePath => {
      const relPath = path.relative(this.root, filePath);
      spinner.start(`Theme changed: ${colorize('blue', relPath)}`);
      await this.rebuildDev(devCtx);
      spinner.succeed(`${spinner.text}, application rebuilt`);
      spinner.start('Watching for file changes...');
    });
    svelteWatcher.on('change', async () => {
      // TODO: Currently breaks the UI. need to figure out why.
      //await this.rebuildClient(devCtx);
    });

    spinner.start('Building app...');
    await this.rebuildDev(devCtx);
    await this.rebuildClient(clientCtx);

    spinner.succeed('Built app');

    const html = this.createHtml();
    await this.updateFile('/main.html', html);

    spinner.start('Starting server...');

    const port = 3000;
    const server = this.createServer();

    new TashmetServer(this.store, server).listen();

    server.listen(port);

    spinner.succeed("Server started");

    consola.box('Website ready at `%s`', `http://localhost:${port}`);

    spinner.start("Watching for file changes...");
    this.started = true;
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
    //consola.start('Building dev server...');

    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.updateFile('/dev.js', buildRes.outputFiles[0].text);
    }

    await this.updateFile('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));
  }

  private async rebuildClient(ctx: esbuild.BuildContext) {
    const buildRes = await ctx.rebuild();
    if (buildRes.outputFiles) {
      await this.aetlan.store.write('/client.js', buildRes.outputFiles[0].text);
    }
    await this.aetlan.store.write('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));
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

  private async updateFile(name: string, content: string) {
    const size = Buffer.from(content).byteLength;
    //consola.withTag('output').ready('Cache: `%s` (%d KB)', name, size / 1000);
    await this.aetlan.store.write(name, content);
  }
}
