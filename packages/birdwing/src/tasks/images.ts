import { Compiler } from '@birdwing/compiler';
import { Task, TaskConfig } from '../command.js';
import { TargetFile } from '@birdwing/core';
import { Database } from '@tashmet/tashmet';
import { extname } from 'path';

export class ImagesTask extends Task<TargetFile[]> {
  constructor(private db: Database, private compiler: Compiler, taskConfig: TaskConfig<TargetFile[]>) {
    super(taskConfig);
  }

  async *execute() {
    const images = await this.db.collection<TargetFile>('images').find().toArray();
    const files =  images.map(file => {
      return { _id: file._id.replace(/^pages/, ''), content: file.content }
    });
    this.compiler.setVariable('svg', files.filter(file => extname(file._id) === '.svg'));
    return files;
  }
}
