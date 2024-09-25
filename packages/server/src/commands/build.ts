import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { loadThemeConfig } from '../config.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';
import { configureSvelte } from '../builders/svelte.js';
import { configureProdApp } from '../builders/prodapp.js';
import { Route } from '@aetlan/core';
import { consola } from 'consola';
import log from 'npmlog';
import ora, { Ora, oraPromise } from 'ora';

//export interface ActionConfig<T> {
  //readonly start: string;
  //readonly success: (result: T) => string;
  //readonly fail?: (err: Error) => string;
//}

//export abstract class Action<T> {
  //constructor(config: ActionConfig<T>) {}

  //abstract run(): Promise<T>;

  //start() {

  //}
//}

//type BuildOutput = Record<string, string>;

//export class CompileAction implements Action<Route[]> {
  //start = "Compiling routes...";

  //constructor(private aetlan: Aetlan) {}

  //async run() {
    //return [];
  //}

  //success()
//}

//function executeAction<T>(action: Action<T>): Promise<T> {
  //action.
//}

//class CompileRoutesAction extends Action<Route[]> {
  //constructor(private aetlan: Aetlan) {
    //super({
      //start: 'Compiling routes...',
      //success: routes => `Compiled ${routes.length} routes`
    //});
  //}

  //async run(): Promise<Route[]> {
    //const routes = await this.aetlan.compile();
    //for (const route of routes) {
      //this.aetlan.store.updateRoute(route);
    //}
    //return routes;
  //}
//}

//class BuildServerAppAction extends Action<void> {

//}
  //private async buildServerApp() {
    //const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));
    //const build = await esbuild.build(configureProdApp(this.root, files));

    //const sandbox = {
      //require: createRequire(import.meta.url),
      //__dirname: path.dirname(fileURLToPath(import.meta.url)),
      //console: {
        //error: (message: string, ...args: any[]) => {
          //this.errors.push({ message, args });
        //}
      //},
      //module: {},
      //exports: {},
      //components: {},
      //TextEncoder,
      //URL,
      //app: (routes: Route[], path: string): string => { return ''; },
      //React,
    //};

    //if (!build.outputFiles) {
      //throw Error('No output files from build');
    //}

    //vm.runInNewContext(build.outputFiles[0].text, sandbox);

    //return sandbox.app;
  //}

//export class BuildClientApp extends Action<BuildOutput> {
  //start = "Building app";
  //success = "Built app";

  //constructor(private ctx: esbuild.BuildContext, private root: string) { super(); }

  //async run() {
    //const output: BuildOutput = {};
    //const buildRes = await this.ctx.rebuild();
    //if (buildRes.outputFiles) {
      //output['/dev.js'] = buildRes.outputFiles[0].text;
    //}

    //output['/main.css'] = await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out'))

    //return output;
  //}
//}

async function* renderHtml(application: any, routes: Route[], html: string) {
  for (const route of routes) {
    const body = application(routes, route.url);

    //const html = fs.readFileSync(path.join(root, 'theme/main.html')).toString();
    const dom = new JSDOM(html);

    dom.window.document.title = route.title;

    const app = dom.window.document.getElementById('app');

    const clientScriptElem = dom.window.document.createElement('script');
    clientScriptElem.setAttribute('type', 'module');
    clientScriptElem.setAttribute('src', '/client.js');
    dom.window.document.body.appendChild(clientScriptElem);

    if (app) {
      app.innerHTML = body;
    }
    const outPath = path.join(route.url, 'index.html');

    yield { path: outPath, content: dom.serialize() };
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

  private async buildServerApp() {
    const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));
    const build = await esbuild.build(configureProdApp(this.root, files));

    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console: {
        error: (message: string, ...args: any[]) => {
          this.errors.push({ message, args });
        }
      },
      module: {},
      exports: {},
      components: {},
      TextEncoder,
      URL,
      app: (routes: Route[], path: string): string => { return ''; },
      React,
    };

    if (!build.outputFiles) {
      throw Error('No output files from build');
    }

    vm.runInNewContext(build.outputFiles[0].text, sandbox);

    return sandbox.app;
  }

  private async updateFile(name: string, content: string) {
    const size = Buffer.from(content).byteLength;
    //consola.withTag('output').ready('Write: `%s` (%d KB)', path.join('out', name), size / 1000);
    //this.spinner.text = 'Write: `%s` (%d KB)', path.join('out', name), size / 1000
    await this.aetlan.store.write(path.join(this.root, 'out', name), content);
  }
}
