import path from 'path';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import * as chokidar from 'chokidar';

import { createDatabase, createStorageEngine } from '../../database.js';

import { Aetlan, CompileContext } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { configureDevClient } from '../../builders/devclient.js';
import { HtmlBuilder } from '../../html.js';
import { DevServer } from './server.js';
import { Command, Task, TaskConfig } from '../../command.js';
import { Theme } from '../../theme.js';
import { LoadThemeTask } from '../../tasks/load-theme.js';
import { Logger } from '../../logger.js';
import { TailwindCssTask } from '../../tasks/tailwind.js';

export class BuildSpaClient extends Task<void> {
  constructor(
    private buildContext: esbuild.BuildContext,
    private store: Store,
    taskConfig: TaskConfig<void>
  ) {
    super(taskConfig);
  }

  async *execute() {
    const buildRes = await this.buildContext.rebuild();
    if (buildRes.outputFiles) {
      await this.store.write('/dev.js', buildRes.outputFiles[0].text);
    }
  }
}

export class ProcessHtmlTask extends Task<void> {
  constructor(private theme: Theme, private store: Store) {
    super({
      start: 'Processing HTML...',
      success: 'Processing HTML',
    })
  }

  async *execute() {
    const html = HtmlBuilder.fromFile(path.join(this.theme.path, 'main.html'))
      .script('/client.js', 'module')
      .script('/dev.js')
      .serialize();
    await this.store.write('/main.html', html);
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
    const devCtx = await esbuild.context(configureDevClient(this.root, await glob.glob(tagsGlob)))
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

    await this.executeTask(new BuildSpaClient(devCtx, aetlan.store, {
      start: 'Building SPA client',
      success: 'Built SPA client',
      fail: 'Building SPA client failed'
    }));

    await this.executeTask(new TailwindCssTask(theme, aetlan.store, '/'));
    await this.executeTask(new ProcessHtmlTask(theme, aetlan.store));

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
          await this.executeTask(new BuildSpaClient(devCtx, aetlan.store, {
            start: Logger.color('gray', 'Rebuilding SPA client'),
            success: Logger.color('gray', 'Rebuilt SPA client'),
            fail: Logger.color('red', 'Rebuilding SPA client failed'),
          }));

          await this.executeTask(new TailwindCssTask(theme, aetlan.store, '/'));
        } catch (err) {
          this.logger.error(err.message);
        }
      });
  }
}
