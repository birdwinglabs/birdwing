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

export class Build {
  constructor(private aetlan: Aetlan) {}

  async run() {
    await this.aetlan.loadAst();
    await this.aetlan.transform();

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

    const renderer = new Renderer(sandbox.components);

    const renderables = await this.aetlan.pagesDb.collection('renderable').find().toArray();
    const routes = renderables.map(r => {
      return {
        path: r._id as string,
        element: renderer.render(r.renderable),
      }
    });

    for (const route of routes) {
      const body = sandbox.app(routes, route.path);

      const html = fs.readFileSync(path.join(this.aetlan.root, 'src/main.html')).toString();
      const dom = new JSDOM(html);
      const app = dom.window.document.getElementById('app');
      if (app) {
        app.innerHTML = body;
      }
      const outfile = path.join(this.aetlan.root, 'out', route.path, 'index.html');
      this.aetlan.store.logger.inScope('html').info(`write: '${outfile}'`);

      await this.aetlan.pagesDb
        .collection('target')
        .replaceOne({_id: outfile }, { _id: outfile, content: dom.serialize()}, { upsert: true });
    }
  }
}
