import { Store } from '@birdwing/store';
import { Task, TaskProgress } from '../command.js';
import { TargetFile } from '@birdwing/core';

export class FileWriterTask extends Task<void> {
  constructor(
    private store: Store,
    private files: TargetFile[],
  ) {
    super({
      start: `Writing ${files.length} files to store...`,
      success: `Wrote ${files.length} files to store`
    });
  }

  async *execute() {
    for await (const file of this.files) {
      yield new TaskProgress(`Writing file: ${file._id}`);
      await this.store.write(file._id, file.content);
    }
  }
}
