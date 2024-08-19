import { FragmentFileHandler } from "./fragment.js";
import { ContentTransform, FileHandler, FragmentConfig, PageData } from "./interfaces.js";
import { PageFileHandler } from "./page.js";

export class Plugin {
  constructor(
    public handlers: FileHandler[] = [],
  ) {}

  page(glob: string, transform: (doc: PageData) => ContentTransform) {
    this.handlers.push(new PageFileHandler(glob, transform));
    return this;
  }

  fragment(glob: string, transform: (doc: PageData) => FragmentConfig) {
    this.handlers.push(new FragmentFileHandler(glob, transform));
    return this;
  }
}
