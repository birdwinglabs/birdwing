import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { Aetlan } from '../aetlan.js';
import { Renderer } from '../renderer.js';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';
import { Route } from '../interfaces.js';

export class Build {
  constructor(private aetlan: Aetlan) {}

  async run() {
    await this.aetlan.loadAst();
    const transformer = await this.aetlan.createTransformer();
    const pages = await transformer.transform();

    const { app: application, components } = await this.buildApp();
    const renderer = new Renderer(components);

    const routes = pages.map(r => {
      return {
        path: r.url,
        element: renderer.render(r.tag),
      }
    });

    for (const route of routes) {
      const body = application(routes, route.path);

      const html = fs.readFileSync(path.join(this.aetlan.root, 'src/main.html')).toString();
      const dom = new JSDOM(html);
      const app = dom.window.document.getElementById('app');
      if (app) {
        app.innerHTML = body;
      }
      await this.updateFile(path.join(route.path, 'index.html'), dom.serialize());
    }

    await this.updateFile('main.css', await this.aetlan.css());
  }

  private async buildApp() {
    const files = await glob.glob(path.join(this.aetlan.root, 'src/tags/**/*.jsx'));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(this.aetlan.root, 'src'), f)

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
        resolveDir: path.join(this.aetlan.root, 'src'),
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
    const _id = path.join(this.aetlan.root, 'out', name);
    //this.aetlan.store.logger.inScope('build').info(`write: '${_id}'`);

    await this.aetlan.db
      .collection('buildtarget')
      .replaceOne({ _id }, { _id, content }, { upsert: true });
  }
}
