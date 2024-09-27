import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';
import { Theme } from '../theme.js';
import { Task } from '../command.js';
import { Store } from '@aetlan/store';

export class TailwindCssTask extends Task<void> {
  constructor(private theme: Theme, private store: Store, private outPath: string) {
    super('Processing CSS...', 'Processed CSS');
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

    await this.store.write(to, css.css);
  }
}
