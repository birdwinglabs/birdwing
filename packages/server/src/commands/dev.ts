import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan, CompileContext } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { configureDevClient } from '../builders/devclient.js';
import { HtmlBuilder } from '../html.js';
import { DevServer } from '../servers/dev-server.js';
import { Command, Task } from '../command.js';
import { Theme } from '../theme.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { Logger } from '../logger.js';
import { TailwindCssTask } from '../tasks/tailwind.js';
import { FileWriterTask } from '../tasks/file-writer.js';
import { TargetFile } from '@aetlan/core';
import { BuildTask } from '../tasks/build.js';

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
    const buildContext = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)));
    const buildTask = new BuildTask(buildContext, {
      start: 'Building SPA client',
      success: 'Built SPA client',
      fail: 'Building SPA client failed'
    });
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

    const output: TargetFile[] = [
      await this.executeTask(buildTask),
      await this.executeTask(new ProcessHtmlTask(theme)),
      await this.executeTask(new TailwindCssTask(theme, '/'))
    ].flat();

    await this.executeTask(new FileWriterTask(aetlan.store, output));

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(aetlan.store, store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    const files = await aetlan.store.findOutput({}).toArray();
    const routes = await aetlan.store.findRoutes({}).toArray();

    this.logger.box('Output (cached):\n  %s\n\nRoutes:\n  %s\n\nWebsite ready at `%s`',
      files.map(f => `${Logger.color('gray', f._id)} (${Math.round(Buffer.from(f.content).byteLength / 1000)} KB)`).join('\n  '),
      routes.map(r => Logger.color('gray', r.url)).join('\n  '),
      `http://localhost:${port}`
    );

    this.logger.info(Logger.color('gray', 'Watching for file changes...'));

    compileCtx.on('done', routes => {
      this.logger.success(`${Logger.color('blue', routes.length)} ${Logger.color('gray', 'Routes updated')}`);
    });

    chokidar
      .watch('**/*.md')
      .on('change', async file => {
        this.logger.log('File changed: %s', Logger.color('blue', file));
        this.logger.start('Compiling routes...');
        await aetlan.store.reloadContent(file);
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

          await this.executeTask(new FileWriterTask(aetlan.store, output));
        } catch (err) {
          this.logger.error(err.message);
        }
      });
  }
}
