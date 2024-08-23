import minimatch from 'minimatch';
import { PageData } from "./interfaces.js";
import { Page } from "./page.js";
import { Fragment } from "./fragment.js";
import { Transformer } from "./transformer.js";

export interface FileNode {
  path: string;

  url: string;

  transform(transformer: Transformer): Page | Fragment;
}

export type FileHandler = (content: PageData) => FileNode;

export interface FileMatcher {
  type: string;

  match: string;
}

export class ContentLoader {
  constructor(
    private fileHandlers: Record<string, FileHandler>,
    private matchers: FileMatcher[]
  ) {}

  private getFileHandler(content: PageData): FileHandler | null {
    for (const { match, type } of this.matchers) {
      if (minimatch(content.path, match)) {
        return this.fileHandlers[type];
      }
    }
    return null;
  }

  load(content: PageData): FileNode {
    const handler = this.getFileHandler(content);

    if (!handler) {
      throw Error('No handler for content');
    }

    return handler(content);
  }
}
