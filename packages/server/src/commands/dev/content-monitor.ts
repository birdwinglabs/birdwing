import path from 'path';

import * as chokidar from 'chokidar';

import { CompileContext } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { Logger } from '../../logger.js';
import { Route } from '@aetlan/core';


export class ContentMonitor {
  constructor(
    private store: Store,
    private logger: Logger,
    private compileContext: CompileContext,
    private root: string
  ) {}

  watch() {
    this.compileContext.on('done', routes => this.onCompilationDone(routes));
    chokidar
      .watch(path.join(this.root, '**/*.md'))
      .on('change', async file => this.onChange(file));
  }

  private async onChange(file: string) {
    const relPath = path.relative(this.root, file);
    this.logger.start(`Content changed: ${Logger.color('blue', relPath)}`);
    await this.store.reloadContent(relPath);
  }

  private onCompilationDone(routes: Route[]) {
    this.logger.success(`${this.logger.text}, ${Logger.color('blue', routes.length)} Routes updated`);
  }
}
