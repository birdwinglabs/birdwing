import path from 'path';

import { Route, TargetFile } from '@birdwing/core';
import { Task } from '../command.js';


export class SerializeRoutesTask extends Task<TargetFile[]> {
  constructor(private routes: Route[], private outDir: string) {
    super({
      start: 'Serializing routes...',
      success: 'Serilized routes'
    })
  }

  async *execute() {
    const output: TargetFile[] = [];
    for (const route of this.routes) {
      output.push({
        _id: path.join(this.outDir, route.url, 'data.json'),
        content: JSON.stringify(route.tag)
      });
    }
    return output;
  }
}
