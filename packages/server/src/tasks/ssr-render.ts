import path from 'path';
import fs from 'fs';

import { Route } from '@aetlan/core';
import { Store } from '@aetlan/store';
import { SsrApp } from '../builders/ssr.js';
import { HtmlBuilder } from '../html.js';
import { Task, TaskProgress, TaskWarning } from '../command.js';


export class RenderSSRTask extends Task<void> {
  constructor(
    private application: SsrApp,
    private routes: Route[],
    private store: Store,
    private root: string,
    private warnings: TaskWarning[]
  ) {
    super({
      start: 'Rendering HTML...',
      success: 'Rendered HTML',
      warnings: (res, warnings) => `Rendered HTML (with ${warnings.length} warnings)`,
    });
  }

  async *execute() {
    const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();

    for (const route of this.routes) {
      const content = new HtmlBuilder(html)
        .title(route.title)
        .script('/client.js', 'module')
        .app(this.application(this.routes, route.url))
        .serialize()

      const relPath = path.join(route.url, 'index.html');
      await this.store.write(path.join(this.root, 'out', relPath), content);
      yield new TaskProgress(`Write HTML: ${relPath}`);
    }

    for (const warning of this.warnings) {
      yield warning;
    }
  }
}
