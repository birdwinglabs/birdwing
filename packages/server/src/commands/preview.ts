import path from 'path';

import * as esbuild from 'esbuild'

export class Preview {
  constructor(private root: string) {}

  async run() {
    const ctx = await esbuild.context({
      stdin: {
        contents: "console.log('preview');",
        loader: 'jsx',
        resolveDir: path.join(this.root, 'src'),
      },
      bundle: true,
      format: 'cjs',
      outfile: path.join(this.root, 'out/app.js'),
      write: true,
    });

    ctx.serve({
      servedir: path.join(this.root, 'out'),
    });
  }
}
