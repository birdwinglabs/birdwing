import { Route, TargetFile } from '@birdwing/core';
import { Task, TaskConfig } from '../command.js';
import { StaticRenderer } from '../react/static.js';
import { Template } from '@birdwing/react';

export class RenderStaticRoutesTask extends Task<TargetFile[]> {
  private renderer: StaticRenderer;

  constructor(private routes: Route[], themeTemplate: Template, taskConfig: TaskConfig<TargetFile[]>) {
    super(taskConfig);
    this.renderer = new StaticRenderer(themeTemplate);
  }

  async *execute() {
    return this.routes.map(route => ({ _id: route.url, content: this.renderer.render(route.tag) }));
  }
}
