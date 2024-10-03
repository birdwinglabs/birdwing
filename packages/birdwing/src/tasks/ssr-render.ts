import path from 'path';
import fs from 'fs';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

import { Route, TargetFile } from '@birdwing/core';
import { HtmlBuilder } from '../html.js';
import { Task, TaskProgress, TaskWarning } from '../command.js';


type SsrApp = (routes: Route[], path: string) => string

export class RenderSSRTask extends Task<TargetFile[]> {
  constructor(
    private code: string,
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
    const app: SsrApp = () => '';

    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console: {
        error: (message: string, ...args: any[]) => {
          this.warnings.push(new TaskWarning(message, ...args));
        },
        log: () => {}
      },
      TextEncoder,
      URL,
      app,
    }

    vm.runInNewContext(this.code, sandbox);

    const html = fs.readFileSync(path.join(this.root, 'theme/main.html')).toString();
    const output: TargetFile[] = [];

    const render = (url: string) => {
      return new Promise<string>((resolve) => {
        setTimeout(() => resolve(app(this.routes, url)), 1);
      });
    }

    for (const route of this.routes) {
      const content = new HtmlBuilder(html)
        .title(route.title)
        .script('/client.js', 'module')
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
