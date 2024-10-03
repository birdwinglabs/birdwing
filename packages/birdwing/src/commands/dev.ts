import path from 'path';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { TargetFile } from '@birdwing/core';
import { Compiler } from '@birdwing/compiler';
import { Store } from '@birdwing/store';

import { createDatabase, createStorageEngine } from '../database.js';
import { configureDevClient } from '../buildconfigs/devclient.js';
import { HtmlBuilder } from '../html.js';
import { DevServer } from '../servers/dev-server.js';
import { Command, Task } from '../command.js';
import { Theme } from '../theme.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { Logger } from '../logger.js';
import { TailwindCssTask } from '../tasks/tailwind.js';
import { FileWriterTask } from '../tasks/file-writer.js';
import { RebuildTask } from '../tasks/build.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';

class ProcessHtmlTask extends Task<TargetFile> {
  constructor(private theme: Theme) {
    super({
      start: 'Processing HTML...',
      success: 'Processed HTML',
    })
  }

  async *execute() {
    const html = HtmlBuilder.fromFile(path.join(this.theme.path, 'main.html'))
      .script('/client.js', 'module')
      .script('/dev.js')
      .serialize();
    return { _id: '/main.html', content: html };
  }
}

export class DevCommand extends Command {
  async execute() {
    this.logger.info("Development server:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const storageEngine = await createStorageEngine();
    const db = await createDatabase(storageEngine, this.root, true);
    const store = Store.fromDatabase(db);
    const compiler = await Compiler.configure(store, theme, this.config);

    const buildContext = await esbuild.context(configureDevClient(this.root, theme));
    const buildTask = new RebuildTask(buildContext, {
      start: 'Building SPA client',
      success: 'Built SPA client',
      fail: 'Building SPA client failed'
    });

    const routes = await this.executeTask(new CompileRoutesTask(compiler));
    for (const route of routes) {
      await store.updateRoute(route);
    }

    const output: TargetFile[] = [
      await this.executeTask(buildTask),
      await this.executeTask(new ProcessHtmlTask(theme)),
      await this.executeTask(new TailwindCssTask(theme, '/'))
    ].flat();

    await this.executeTask(new FileWriterTask(store, output));

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(store, storageEngine)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    const files = await store.findOutput({}).toArray();

    this.logger.box('Output (cached):\n  %s\n\nRoutes:\n  %s\n\nWebsite ready at `%s`',
      files.map(f => `${Logger.color('gray', f._id)} (${Math.round(Buffer.from(f.content).byteLength / 1000)} KB)`).join('\n  '),
      routes.map(r => Logger.color('gray', r.url)).join('\n  '),
      `http://localhost:${port}`
    );

    this.logger.info(Logger.color('gray', 'Watching for file changes...'));

    const compileCtx = compiler.watch();

    compileCtx.on('route-compiled', async route => {
      await store.updateRoute(route);
    });
    compileCtx.on('done', routes => {
      this.logger.success(`${Logger.color('blue', routes.length)} ${Logger.color('gray', 'Routes updated')}`);
    });

    chokidar
      .watch('**/*.md')
      .on('change', async file => {
        this.logger.log('File changed: %s', Logger.color('blue', file));
        this.logger.start('Compiling routes...');
        await store.reloadContent(file);
      });

    chokidar
      .watch(theme.jsxGlob)
      .on('change', async file => {
        this.logger.log('File changed: %s', Logger.color('blue', file));

        try {
          const output: TargetFile[] = [
            await this.executeTask(buildTask),
            await this.executeTask(new TailwindCssTask(theme, '/'))
          ].flat();

          await this.executeTask(new FileWriterTask(store, output));
        } catch (err) {
          this.logger.error(err.message);
        }
      });
  }
}
