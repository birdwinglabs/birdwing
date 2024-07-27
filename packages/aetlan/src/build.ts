import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'
import { renderToString } from 'react-dom/server';

import { Aetlan } from './aetlan.js';
import { Renderer } from './renderer.js';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

import { JSDOM } from 'jsdom';

export class Build {
  constructor(private aetlan: Aetlan) {}

  async run(root: string) {
    await this.aetlan.loadAst();
    await this.aetlan.transform();

    const files = await glob.glob(path.join(root, 'src/tags/**/*.jsx'));

    const imports = files.map(f => {
      const name = path.basename(f, path.extname(f));
      const file = path.relative(path.join(root, 'src'), f)

      return { name, file };
    });

    const code = `
      ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

      components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };
    `;

    let build = await esbuild.build({
      stdin: {
        contents: code,
        loader: 'jsx',
        resolveDir: path.join(root, 'src'),
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
      React,
    };

    vm.runInNewContext(build.outputFiles[0].text, sandbox);

    const renderer = new Renderer(sandbox.components);

    for await (const doc of this.aetlan.pagesDb.collection('renderable').find()) {
      const result = renderer.render(doc.renderable);
      const body = renderToString(result);
      const html = fs.readFileSync(path.join(root, 'src/main.html')).toString();
      const dom = new JSDOM(html);
      const app = dom.window.document.getElementById('app');
      if (app) {
        app.innerHTML = body;
      }
      const outfile = path.join(root, 'out', doc._id as string, 'index.html');
      console.log(outfile);

      await this.aetlan.pagesDb
        .collection('target')
        .replaceOne({_id: outfile }, { _id: outfile, content: dom.serialize()}, { upsert: true });
    }
  }
}
