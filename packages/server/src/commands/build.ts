import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';
import { Aetlan, Renderer, Plugin, PluginContext, Transformer } from '@aetlan/aetlan';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';

export class Build {
  constructor(
    private aetlan: Aetlan,
    private transformer: Transformer,
    private root: string
  ) {}

  static async create(root: string, plugins: Plugin[]) {
    const store = await createStorageEngine();
    const db = await createDatabase(store, root, false);

    const aetlan = await Aetlan.load(db);
    const transformer = await Transformer.initialize(
      await aetlan.findContent({}).toArray(), new PluginContext(plugins)
    );

    return new Build(aetlan, transformer, root);
  }

  async run() {
    const { app: application, components } = await this.buildApp();
    const renderer = new Renderer(components);

    const routes: any[] = [];
    for (const page of await this.transformer.transform()) {
      routes.push({
        path: page.url,
        element: renderer.render(await page.compile())
      });
    }

    for (const route of routes) {
      const body = application(routes, route.path);

      const html = fs.readFileSync(path.join(this.root, 'src/main.html')).toString();
      const dom = new JSDOM(html);
      const app = dom.window.document.getElementById('app');
      if (app) {
        app.innerHTML = body;
      }
      await this.updateFile(path.join(route.path, 'index.html'), dom.serialize());
    }

    await this.updateFile('main.css', await generateCss(this.root));
  }

  private async buildApp() {
    const files = await glob.glob(path.join(this.root, 'src/tags/**/*.jsx'));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.root, 'src'), f)

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
        resolveDir: path.join(this.root, 'src'),
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
    await this.aetlan.write(path.join(this.root, 'out', name), content);
  }
}
