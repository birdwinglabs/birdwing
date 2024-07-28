import path from 'path';

import * as esbuild from 'esbuild'

import { Aetlan } from '../aetlan.js';

export class Preview {
  constructor(private aetlan: Aetlan) {}

  async run() {
    const ctx = await esbuild.context({
      stdin: {
        contents: "console.log('preview');",
        loader: 'jsx',
        resolveDir: path.join(this.aetlan.root, 'src'),
      },
      bundle: true,
      format: 'cjs',
      outfile: path.join(this.aetlan.root, 'out/app.js'),
      write: true,
    });

    ctx.serve({
      servedir: path.join(this.aetlan.root, 'out'),
    });
  }
}
