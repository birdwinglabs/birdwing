import path from 'path';

import * as esbuild from 'esbuild'

import { Aetlan } from '../aetlan.js';

export class Preview {
  constructor(private aetlan: Aetlan) {}

  async run(root: string) {
    const ctx = await esbuild.context({
      stdin: {
        contents: "console.log('preview');",
        loader: 'jsx',
        resolveDir: path.join(root, 'src'),
      },
      bundle: true,
      format: 'cjs',
      outfile: path.join(root, 'out/app.js'),
      write: true,
    });

    ctx.serve({
      servedir: path.join(root, 'out'),
    });
  }
}
