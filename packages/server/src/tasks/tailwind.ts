import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';
import { Theme } from '../theme.js';
import { Task } from '../command.js';
import { Logger } from '../logger.js';
import { TargetFile } from '@aetlan/core';

export class TailwindCssTask extends Task<TargetFile> {
  constructor(private theme: Theme, private outPath: string) {
    super({
      start: Logger.color('gray', 'Processing CSS...'),
      success: Logger.color('gray', 'Processed CSS')
    });
  }

  async *execute() {
    const cssProc = postcss([
      tailwind({
        config: path.join(this.theme.path, 'tailwind.config.js'),
      })
    ]);

    const cssPath = path.join(this.theme.path, 'main.css');
    const to = path.join(this.outPath, 'main.css');
    const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to });

    return { _id: to, content: css.css };
  }
}
