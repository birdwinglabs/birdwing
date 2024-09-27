import path from 'path';
import fs from 'fs';

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';

import { SsrApp, SsrBuilder, SsrRunner } from '../builders/ssr.js';
import { Route } from '@aetlan/core';
import { HtmlBuilder } from '../html.js';
import { Command } from '../command.js';
import { Theme } from '../theme.js';


async function* renderHtml(application: any, routes: Route[], html: string) {
  for (const route of routes) {
    const content = new HtmlBuilder(html)
      .title(route.title)
      .script('/client.js', 'module')
      .app(application(routes, route.url))
      .serialize()

    yield {
      path: path.join(route.url, 'index.html'),
      content
    };
  }
}

export class BuildCommand extends Command {
  private errors: any[] = [];

  async execute() {
    console.log("Production build:\n");

    const theme = await this.loadTheme();
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

    let routes: Route[] = [];
    let application: SsrApp;

    try {
      this.logger.start('Compiling routes...');
      routes = await aetlan.compile();
      this.logger.success(`Compiled ${routes.length} routes`);
    } catch (err) {
      this.logger.error('Compiling routes failed');
      throw err;
    }

    try {
      this.logger.start('Building server app...');
      application = await this.buildSsrApp(theme);
      this.logger.success('Built server app');
    } catch(err) {
      this.logger.error('Build server app failed');
      throw err;
    }

    try {
      this.logger.start('Rendering HTML...');
      const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();

      for await (const { path, content } of renderHtml(application, routes, html)) {
        await this.write(path, content, aetlan.store);
        this.logger.update(`Write HTML: ${path}`);
      }
      if (this.errors.length > 0) {
        throw Error(`Rendered HTML with ${this.errors.length} errors`);
      }
      this.logger.success('Rendered HTML');
    } catch (err) {
      this.logger.error(err.message);
    }

    try {
      this.logger.start('Generating CSS...');
      const css = await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out'));
      await this.write('main.css', css, aetlan.store);
      this.logger.success('Generated CSS');
    } catch (err) {
      this.logger.error('Failed to generate CSS');
      throw err;
    }

    for (const err of this.errors) {
      this.logger.error(err.message, ...err.args);
    }

    this.logger.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }

  private async buildSsrApp(theme: Theme) {
    const builder = new SsrBuilder(theme);
    const runner = new SsrRunner({
      error: (message: string, ...args: any[]) => {
        this.errors.push({ message, args });
      }
    });

    return runner.run(await builder.build());
  }

  private async write(name: string, content: string, store: Store) {
    await store.write(path.join(this.root, 'out', name), content);
  }
}
