import path from 'path';
import fs from 'fs';

import { Route, TargetFile } from '@birdwing/core';
import { SsrApp } from '../builders/ssr.js';
import { HtmlBuilder } from '../html.js';
import { Task, TaskProgress, TaskWarning } from '../command.js';


export class RenderSSRTask extends Task<TargetFile[]> {
  constructor(
    private application: SsrApp,
    private routes: Route[],
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
    const output: TargetFile[] = [];

    const render = (url: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(this.application(this.routes, url)), 1);
      });
    }

    for (const route of this.routes) {
      const content = new HtmlBuilder(html)
        .title(route.title)
        .script('/client.js')
        .app(await render(route.url))
        .serialize()

      const targetPath = path.join(this.root, 'out', route.url, 'index.html');
      output.push({ _id: targetPath, content: content });

      yield new TaskProgress(`Generated HTML: ${targetPath}`);
    }

    for (const warning of this.warnings) {
      yield warning;
    }

    return output;
  }
}
