import path from 'path';
import fs from 'fs';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';

import { SsrApp, SsrBuilder, SsrRunner } from '../builders/ssr.js';
import { Route } from '@aetlan/core';
import { HtmlBuilder } from '../html.js';
import { Command, Task, TaskProgress, TaskWarning } from '../command.js';
import { Theme } from '../theme.js';
import { LoadThemeTask } from '../tasks/load-theme.js';


class CompileRoutesTask extends Task<Route[]> {
  constructor(private aetlan: Aetlan) { 
    super('Compiling routes...', routes => `Compiled ${routes.length} routes`);
  }

  async *execute() {
    try {
      return await this.aetlan.compile();
    } catch (err) {
      throw new Error('Compiling routes failed');
    }
  }
}

class BuildSsrAppTask extends Task<SsrApp> {
  constructor(private theme: Theme, private warnings: TaskWarning[]) {
    super('Building SSR application...', 'Built SSR application');
  }

  async *execute() {
    const builder = new SsrBuilder(this.theme);
    const runner = new SsrRunner({
      error: (message: string, ...args: any[]) => {
        this.warnings.push(new TaskWarning(message, ...args));
        //console.log(message);
      }
    });
    return runner.run(await builder.build());
  }
}

class RenderSSRTask extends Task<void> {
  constructor(
    private application: SsrApp,
    private routes: Route[],
    private store: Store,
    private root: string,
    private warnings: TaskWarning[]
  ) {
    super('Rendering HTML...', (res, warnings) => warnings.length === 0 
      ? 'Rendered HTML'
      : `Rendered HTML (with ${warnings.length} warnings)`
    );
  }

  async *execute() {
    const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();

    for (const route of this.routes) {
      const content = new HtmlBuilder(html)
        .title(route.title)
        .script('/client.js', 'module')
        .app(this.application(this.routes, route.url))
        .serialize()

      const relPath = path.join(route.url, 'index.html');
      await this.store.write(path.join(this.root, 'out', relPath), content);
      yield new TaskProgress(`Write HTML: ${relPath}`);
    }

    for (const warning of this.warnings) {
      yield warning;
    }
  }
}


export class BuildCommand extends Command {
  async execute() {
    console.log("Production build:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const store = await createStorageEngine();
    const db = await createDatabase(store, this.root, false);

    const aetlan = new Aetlan(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: this.config.content,
      variables: this.config.variables || {},
    });

    const warnings: TaskWarning[] = [];

    const routes = await this.executeTask(new CompileRoutesTask(aetlan));
    const application = await this.executeTask(new BuildSsrAppTask(theme, warnings));
  
    await this.executeTask(new RenderSSRTask(application, routes, aetlan.store, this.root, warnings));

    try {
      this.logger.start('Generating CSS...');
      const css = await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out'));
      await this.write('main.css', css, aetlan.store);
      this.logger.success('Generated CSS');
    } catch (err) {
      this.logger.error('Failed to generate CSS');
      throw err;
    }

    this.logger.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }

  private async write(name: string, content: string, store: Store) {
    await store.write(path.join(this.root, 'out', name), content);
  }
}
