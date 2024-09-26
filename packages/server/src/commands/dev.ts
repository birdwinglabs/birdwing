import http from 'http';
import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';
import { loadAppConfig } from '../config.js';
import { configureSvelte } from '../builders/svelte.js';
import { configureDevClient } from '../builders/devclient.js';
import { HtmlBuilder } from '../html.js';
import { Theme } from '../theme.js';
import { Logger } from '../logger.js';


export class DevCommand {
  private started: boolean = false;
  private logger = new Logger();

  constructor(
    private aetlan: Aetlan,
    private theme: Theme,
    private store: StorageEngine,
    private root: string
  ) {
  }

  static async configure(configFile: string) {
    const root = path.dirname(configFile);
    const config = loadAppConfig(configFile);
    const theme = await Theme.load(path.join(root, config.theme || 'theme', 'theme.config.ts'));

    const store = await createStorageEngine();
    const db = await createDatabase(store, root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: config.content,
      variables: config.variables || {},
    });

    return new DevCommand(aetlan, theme, store, root);
  }

  async run() {
    this.logger.info("Development server:\n");

    const tagsGlob = path.join(this.root, 'theme/tags/**/*.jsx');
    const jsxGlob = path.join(this.root, 'theme/**/*.jsx');
    const clientGlob = path.join(this.root, 'theme/client/**/*.svelte');
    const contentGlob = path.join(this.root, '**/*.md');

    const contentWatcher = chokidar.watch(contentGlob);
    const jsxWatcher = chokidar.watch(jsxGlob);

    this.logger.start("Compiling routes...");
    const compileCtx = await this.aetlan.watch();

    compileCtx.on('route-compiled', route => {
      this.aetlan.store.updateRoute(route)
    });
    compileCtx.on('done', routes => {
      if (this.started) {
        this.logger.success(`${this.logger.text}, ${Logger.color('blue', routes.length)} Routes updated`);
      }
    })
    compileCtx.transform();

    this.logger.success("Compiled routes");

    contentWatcher.on('change', async filePath => {
      const relPath = path.relative(this.root, filePath);
      this.logger.start(`Content changed: ${Logger.color('blue', relPath)}`);
      await this.aetlan.store.reloadContent(relPath);
    });

    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
    const clientCtx = await esbuild.context(configureSvelte(this.root, await glob.glob(clientGlob), 'theme'));

    jsxWatcher.on('change', async filePath => {
      const relPath = path.relative(this.root, filePath);
      this.logger.start(`Theme changed: ${Logger.color('blue', relPath)}`);
      await this.rebuildDev(devCtx);
      this.logger.success(`${this.logger.text}, application rebuilt`);
      //spinner.start('Watching for file changes...');
    });

    this.logger.start('Building app...');
    await this.rebuildDev(devCtx);
    await this.rebuildClient(clientCtx);

    this.logger.success('Built app');
    this.logger.start('Generating HTML...');

    const html = HtmlBuilder.fromFile(path.join(this.root, 'theme/main.html'))
      .script('/client.js', 'module')
      .script('/dev.js')
      .serialize();

    this.logger.success('Generated HTML');

    await this.updateFile('/main.html', html);

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(this.aetlan.store, this.store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    this.logger.box('Website ready at `%s`', `http://localhost:${port}`);

    this.started = true;
  }

  private async rebuildDev(ctx: esbuild.BuildContext) {
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

  private async updateFile(name: string, content: string) {
    const size = Buffer.from(content).byteLength;
    //consola.withTag('output').ready('Cache: `%s` (%d KB)', name, size / 1000);
    await this.aetlan.store.write(name, content);
  }
}

class DevServer {
  private server: http.Server;
  private tashmetServer: TashmetServer;

  constructor(private store: Store, private storageEngine: StorageEngine) {}

  initialize() {
    this.server = http.createServer(async (req, res) => {
      const url = req.url || '';
      const route = await this.store.getRoute(url);

      if (route) {
        const content = await this.store.getOutput('/main.html');
        res.setHeader('Content-Type', 'text/html');
        res.write(content || '');
        res.end();
      } else {
        const content = await this.store.getOutput(req.url || '');
        if (req.url?.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript')
        }
        res.write(content || '');
        res.end();
      }
    });
    this.tashmetServer = new TashmetServer(this.storageEngine, this.server)
    return this;
  }

  listen(port: number) {
    this.tashmetServer.listen();
    this.server.listen(port);
  }
}