import * as esbuild from 'esbuild'

import { generateCss } from '../../css.js';

import { Store } from '@aetlan/store';
import { Theme } from '../../theme.js';


export class DevClientBuilder {
  constructor(
    private buildContext: esbuild.BuildContext,
    private theme: Theme,
    private store: Store,
    private outDir: string,
  ) {}

  async rebuild() {
    const buildRes = await this.buildContext.rebuild();
    if (buildRes.outputFiles) {
      await this.store.write('/dev.js', buildRes.outputFiles[0].text);
    }

    await this.store.write('/main.css', await generateCss(this.theme.path, this.outDir));
  }
}
