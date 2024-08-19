import { PageData, FileHandler } from "./interfaces.js";
import minimatch from 'minimatch';

export class ContentFactory {
  constructor(private handlers: FileHandler[]) {}

  public getFileHandler(content: PageData): FileHandler | null {
    for (const handler of this.handlers) {
      if (minimatch(content.path, handler.glob)) {
        return handler;
      }
    }
    return null;
  }
}
