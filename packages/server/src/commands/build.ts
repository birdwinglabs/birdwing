import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { loadThemeConfig } from '../config.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';

import { configureSvelte } from '../builders/svelte.js';
import { SsrApp, SsrBuilder, SsrRunner, Theme } from '../builders/ssr.js';
import { Route } from '@aetlan/core';
import { consola } from 'consola';
import { oraPromise } from 'ora';
import { HtmlBuilder } from '../html.js';


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

export class Build {
  private errors: any[] = [];

  constructor(
    private aetlan: Aetlan,
    private root: string
  ) {}

  static async configure(configFile: string) {
    console.log("Production build:\n");

    const config = await loadThemeConfig(configFile);
    const root = path.dirname(configFile);

    const store = await createStorageEngine();
    const db = await createDatabase(store, root, false);

    const aetlan = new Aetlan(Store.fromDatabase(db), config);

    return new Build(aetlan, root);
  }

  async run() {
    const routes = await oraPromise(() => this.aetlan.compile(), {
      indent: 2,
      text: 'Compiling routes',
      successText: routes => `Compiled ${routes.length} routes`,
    });

    const application = await oraPromise(() => this.buildServerApp(), {
      indent: 2,
      text: 'Building server app...',
      successText: 'Built server app',
    });

    try {
      await oraPromise(async spinner => {
        const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();

        for await (const { path, content } of renderHtml(application, routes, html)) {
          await this.updateFile(path, content);

          spinner.text = `Write HTML: ${path}`;
        }
        if (this.errors.length > 0) {
          throw Error(`Rendered HTML with ${this.errors.length} errors`);
        }
      }, {
        indent: 2,
        text: 'Rendering HTML...',
        successText: 'Rendered HTML',
        failText: error => error.message,
      });
    } catch (err) {}

    await oraPromise(() => this.generateCss(), {
      indent: 2,
      text: 'Generating CSS',
      successText: 'Generated CSS',
    });

    for (const err of this.errors) {
      consola.error(err.message, ...err.args);
    }

    consola.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }

  private async generateCss() {
    await this.updateFile('main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')))
  }

  private async buildClientApp() {
    const files = await glob.glob(path.join(this.root, 'theme/client/**/*.svelte'));
    const buildOptions = configureSvelte(this.root, files, 'theme');

    const clientRes = await esbuild.build(buildOptions)

    if (clientRes.outputFiles) {
      const output = clientRes.outputFiles[0].text;
      await this.updateFile('client.js', output);
    }
  }

  private async buildServerApp(): Promise<SsrApp> {
    const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));

    const theme: Theme = {
      path: path.join(this.root, 'theme'),
      components: files.map(f => path.basename(f, path.extname(f))),
    };

    const builder = new SsrBuilder(theme);
    const runner = new SsrRunner({
      error: (message: string, ...args: any[]) => {
        this.errors.push({ message, args });
      }
    });

    return runner.run(await builder.build());
  }

  private async updateFile(name: string, content: string) {
    const size = Buffer.from(content).byteLength;
    //consola.withTag('output').ready('Write: `%s` (%d KB)', path.join('out', name), size / 1000);
    //this.spinner.text = 'Write: `%s` (%d KB)', path.join('out', name), size / 1000
    await this.aetlan.store.write(path.join(this.root, 'out', name), content);
  }
}
