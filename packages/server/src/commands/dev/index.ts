import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { createDatabase, createStorageEngine } from '../../database.js';

import { Aetlan, CompileContext } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { StorageEngine } from '@tashmet/engine';
import { loadAppConfig } from '../../config.js';
import { configureDevClient } from '../../builders/devclient.js';
import { HtmlBuilder } from '../../html.js';
import { Theme } from '../../theme.js';
import { Logger } from '../../logger.js';
import { ContentMonitor } from './content-monitor.js';
import { DevClientBuilder } from './client-builder.js';
import { ThemeMonitor } from './theme-monitor.js';
import { DevServer } from './server.js';


export class DevCommand {
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
    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
    const builder = new DevClientBuilder(devCtx, this.theme, this.aetlan.store, path.join(this.root, 'out'));
    let compileCtx: CompileContext;

    try {
      this.logger.start("Compiling routes...");
      compileCtx = await this.aetlan.watch();

      compileCtx.on('route-compiled', route => {
        this.aetlan.store.updateRoute(route)
      });
      compileCtx.transform();

      this.logger.success("Compiled routes");
    } catch(err) {
      this.logger.error("Compiling routes failed");
      throw err;
    }

    try {
      this.logger.start('Building app...');
      await builder.rebuild();
      this.logger.success('Built app');
    } catch (err) {
      this.logger.error('Build failed');
      this.logger.error(err.message);
    }

    try {
      this.logger.start('Generating HTML...');

      const html = HtmlBuilder.fromFile(path.join(this.root, 'theme/main.html'))
        .script('/client.js', 'module')
        .script('/dev.js')
        .serialize();

      await this.aetlan.store.write('/main.html', html);
      this.logger.success('Generated HTML');
    } catch (err) {
      this.logger.error('Generating HTML failed');
      throw err;
    }

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(this.aetlan.store, this.store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    this.logger.box('Website ready at `%s`', `http://localhost:${port}`);

    new ContentMonitor(this.aetlan.store, this.logger, compileCtx, this.root).watch();
    new ThemeMonitor(this.theme, builder, this.logger, this.root).watch();
  }
}
