import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { Aetlan, AetlanConfig } from '@aetlan/aetlan';
import { Renderer } from '@aetlan/renderer';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';

export class Build {
  constructor(
    private aetlan: Aetlan,
    private root: string
  ) {}

  static async create(root: string, config: AetlanConfig) {
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, false);

    const aetlan = await Aetlan.load(db, config);

    return new Build(aetlan, root);
  }

  async run() {
    const { app: application, components } = await this.buildApp();
    const renderer = new Renderer(components);

    const routes: any[] = [];
    for (const route of await this.aetlan.compile()) {
      routes.push({
        path: route.url,
        element: renderer.render(route.tag),
      });
    }

    for (const route of routes) {
      const body = application(routes, route.path);

      const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();
      const dom = new JSDOM(html);
      const app = dom.window.document.getElementById('app');
      if (app) {
        app.innerHTML = body;
      }
      await this.updateFile(path.join(route.path, 'index.html'), dom.serialize());
    }

    await this.updateFile('main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));
  }

  private async buildApp() {
    const files = await glob.glob(path.join(this.root, 'theme/tags/**/*.jsx'));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.root, 'theme'), f)

      return { name, file };
    });

    const code = `
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

    let build = await esbuild.build({
      stdin: {
        contents: code,
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
    await this.aetlan.store.write(path.join(this.root, 'out', name), content);
  }
}
