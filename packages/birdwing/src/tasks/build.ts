import * as esbuild from 'esbuild'
import { Task, TaskConfig } from '../command.js';
import { TargetFile } from '@birdwing/core';

export class BuildTask extends Task<TargetFile[]> {
  constructor(private buildContext: esbuild.BuildContext, taskConfig: TaskConfig<TargetFile[]>) {
    super(taskConfig);
  }

  async *execute() {
    const buildRes = await this.buildContext.rebuild();

    return (buildRes.outputFiles || []).map(f => {
      return { _id: f.path, content: f.text };
    })
  }
}
