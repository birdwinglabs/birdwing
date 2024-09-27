import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { createDatabase, createStorageEngine } from '../../database.js';

import { Aetlan, CompileContext } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { configureDevClient } from '../../builders/devclient.js';
import { HtmlBuilder } from '../../html.js';
import { ContentMonitor } from './content-monitor.js';
import { DevClientBuilder } from './client-builder.js';
import { ThemeMonitor } from './theme-monitor.js';
import { DevServer } from './server.js';
import { Command } from '../../command.js';
import { Theme } from '../../theme.js';
import { LoadThemeTask } from '../../tasks/load-theme.js';

export class DevCommand extends Command {
  async execute() {
    this.logger.info("Development server:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const store = await createStorageEngine();
    const db = await createDatabase(store, this.root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: this.config.content,
      variables: this.config.variables || {},
    });

    const tagsGlob = path.join(this.root, 'theme/tags/**/*.jsx');
    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
    const builder = new DevClientBuilder(devCtx, theme, aetlan.store, path.join(this.root, 'out'));
    let compileCtx: CompileContext;

    try {
      this.logger.start("Compiling routes...");
      compileCtx = await aetlan.watch();

      compileCtx.on('route-compiled', route => {
        aetlan.store.updateRoute(route)
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
      await this.generateHtml(theme, aetlan.store);
      this.logger.success('Generated HTML');
    } catch (err) {
      this.logger.error('Generating HTML failed');
      throw err;
    }

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(aetlan.store, store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    this.logger.box('Website ready at `%s`', `http://localhost:${port}`);

    new ContentMonitor(aetlan.store, this.logger, compileCtx, this.root).watch();
    new ThemeMonitor(theme, builder, this.logger, this.root).watch();
  }

  private async generateHtml(theme: Theme, store: Store) {
    const html = HtmlBuilder.fromFile(path.join(theme.path, 'main.html'))
      .script('/client.js', 'module')
      .script('/dev.js')
      .serialize();
    await store.write('/main.html', html);
  }
}
