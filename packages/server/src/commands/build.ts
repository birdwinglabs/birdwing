import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { loadConfig } from '../config.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { Renderer } from '@aetlan/renderer';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';
import { buildSvelteApp } from '../svelte.js';

export class Build {
  constructor(
    private aetlan: Aetlan,
    private root: string
  ) {}

  static async configure(configFile: string) {
    const config = await loadConfig(configFile);
    const root = path.dirname(configFile);

    const store = await createStorageEngine();
    const db = await createDatabase(store, root, false);

    const aetlan = new Aetlan(Store.fromDatabase(db), config);

    return new Build(aetlan, root);
  }

  async run() {
    console.log('Building client app...');
    const files = await glob.glob(path.join(this.root, 'theme/client/**/*.svelte'));
    const clientApp = await buildSvelteApp(this.root, files, 'theme');

    if (clientApp) {
      await this.updateFile('client.js', clientApp);
    }

    console.log('Building server app...');
    const { app: application, components } = await this.buildServerApp();
    const renderer = new Renderer(components);

    const routes = await this.aetlan.compile();
    const appData = routes.map(r => ({ path: r.url, element: renderer.render(r.tag)}));

    for (const route of routes) {
      const body = application(appData, route.url);

      const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();
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
      await this.updateFile(path.join(route.url, 'index.html'), dom.serialize());
    }

    await this.updateFile('main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));
  }

  private createServerCode(jsxFiles: string[]) {
    const imports = jsxFiles.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.root, 'theme'), f)

      return { name, file };
    });

    return `
      import { Routes, Route } from 'react-router-dom';
      import { StaticRouter } from "react-router-dom/server";
      import ReactDOMServer from "react-dom/server";

      ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

      components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };
      app = (routes, path) => {
        return ReactDOMServer.renderToString(
          <StaticRouter location={path}>
            <Routes>
              { routes.map(r => <Route path={r.path} element={r.element} />)}
            </Routes>
          </StaticRouter>
        );
      }
    `;
  }

  private async buildServerApp() {
    const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));
    const serverCode = this.createServerCode(files);

    let build = await esbuild.build({
      stdin: {
        contents: serverCode,
        loader: 'jsx',
        resolveDir: path.join(this.root, 'theme'),
      },
      bundle: true,
      format: 'cjs',
      outfile: 'out.js',
      write: false,
    });

    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console,
      module: {},
      exports: {},
      components: {},
      TextEncoder,
      URL,
      app: (routes: any, path: string): string => { return ''; },
      React,
    };

    vm.runInNewContext(build.outputFiles[0].text, sandbox);

    return { app: sandbox.app, components: sandbox.components };
  }

  private async updateFile(name: string, content: string) {
    console.log(`write: ${name}`);
    await this.aetlan.store.write(path.join(this.root, 'out', name), content);
  }
}
