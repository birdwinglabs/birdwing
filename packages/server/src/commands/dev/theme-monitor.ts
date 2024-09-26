import path from 'path';

import * as chokidar from 'chokidar';

import { Theme } from '../../theme.js';
import { Logger } from '../../logger.js';
import { DevClientBuilder } from './client-builder.js';


export class ThemeMonitor {
  constructor(
    private theme: Theme,
    private devClientBuilder: DevClientBuilder,
    private logger: Logger,
    private root: string,
  ) {}

  private async onChange(file: string) {
    const relPath = path.relative(this.root, file);
    this.logger.start(`Theme changed: ${Logger.color('blue', relPath)}`);

    try {
      await this.devClientBuilder.rebuild();
      this.logger.success(`${this.logger.text}, application rebuilt`);
    } catch (err) {
      this.logger.error('Build failed');
      this.logger.error(err.message);
    }
  }

  watch() {
    chokidar
      .watch(this.theme.jsxGlob)
      .on('change', async file => this.onChange(file));
  }
}
