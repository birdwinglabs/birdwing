import { Route, TargetFile } from '@birdwing/core';
import { Task, TaskConfig } from '../command.js';
import { StaticRenderer } from '../react/static.js';

export class RenderStaticRoutesTask extends Task<TargetFile[]> {
  private renderer = new StaticRenderer({});

  constructor(private routes: Route[], taskConfig: TaskConfig<TargetFile[]>) {
    super(taskConfig);
  }

  async *execute() {
    return this.routes.map(route => ({ _id: route.url, content: this.renderer.render(route.tag) }));
  }
}
