import { Page, PageData, Fragment, FileHandler, PageFileHandler, FragmentFileHandler } from "./interfaces.js";
import minimatch from 'minimatch';

export class ContentFactory {
  constructor(private handlers: FileHandler[]) {}

  async createContent(doc: PageData, urls: Record<string, string>): Promise<Page | Fragment | null> {
    const handler = this.getFileHandler(doc);

    if (handler instanceof PageFileHandler) {
      return handler.createPage(doc);
    } else if (handler instanceof FragmentFileHandler) {
      return handler.createFragment(doc, urls);
    }
    return null;
  }

  async createPages(documents: PageData[]): Promise<Page[]> {
    const pages: Page[] = [];

    for (const doc of documents) {
      const handler = this.getFileHandler(doc);

      if (handler instanceof PageFileHandler) {
        pages.push(await handler.createPage(doc));
      }
    }
    return pages;
  }

  async createFragments(documents: PageData[], urls: Record<string, string>): Promise<Fragment[]> {
    const fragments: Fragment[] = [];

    for (const doc of documents) {
      const handler = this.getFileHandler(doc);

      if (handler instanceof FragmentFileHandler) {
        fragments.push(await handler.createFragment(doc, urls));
      }
    }
    return fragments;
  }

  private getFileHandler(content: PageData): FileHandler | null {
    for (const handler of this.handlers) {
      if (minimatch(content.path, handler.glob)) {
        return handler;
      }
    }
    return null;
  }
}
