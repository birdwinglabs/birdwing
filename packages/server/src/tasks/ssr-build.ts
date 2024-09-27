import { SsrApp, SsrBuilder, SsrRunner } from '../builders/ssr.js';
import { Task, TaskWarning } from '../command.js';
import { Theme } from '../theme.js';

export class BuildSsrAppTask extends Task<SsrApp> {
  constructor(private theme: Theme, private warnings: TaskWarning[]) {
    super({
      start: 'Building SSR application...',
      success: 'Built SSR application',
      fail: 'Building SSR application failed'
    });
  }

  async *execute() {
    const builder = new SsrBuilder(this.theme);
    const runner = new SsrRunner({
      error: (message: string, ...args: any[]) => {
        this.warnings.push(new TaskWarning(message, ...args));
      }
    });
    return runner.run(await builder.build());
  }
}
