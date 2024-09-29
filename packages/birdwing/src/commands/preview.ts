import path from 'path';

import * as esbuild from 'esbuild'
import consola from 'consola';
import { Command } from '../command.js';

export class PreviewCommand extends Command {
  //constructor(private root: string) {}

  async execute() {
    consola.start("Starting static server...");

    const ctx = await esbuild.context({
      stdin: {
        contents: "console.log('preview');",
        loader: 'jsx',
        resolveDir: path.join(this.root, 'src'),
      },
      bundle: true,
      format: 'cjs',
      outfile: path.join(this.root, 'out/dummy.js'),
      write: false,
    });

    ctx.serve({
      servedir: path.join(this.root, 'out'),
    });

    this.logger.box("Website ready at `%s`", `http://localhost:8000`);
  }
}
