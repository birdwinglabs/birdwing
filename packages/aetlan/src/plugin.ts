import { FragmentFileHandler } from "./fragment.js";
import { ContentTransform, FileHandler, FragmentConfig, PageData } from "./interfaces.js";
import { PageFileHandler } from "./page.js";
import { CustomTag } from "./tag.js";
import minimatch from 'minimatch';

export class Plugin {
  constructor(
    public handlers: FileHandler[] = [],
    public tags: Record<string, CustomTag> = {},
  ) {}

  page(glob: string, transform: (doc: PageData) => ContentTransform) {
    this.handlers.push(new PageFileHandler(glob, transform));
    return this;
  }

  fragment(glob: string, transform: (doc: PageData) => FragmentConfig) {
    this.handlers.push(new FragmentFileHandler(glob, transform));
    return this;
  }

  tag(name: string, tag: CustomTag) {
    this.tags[name] = tag;
    return this;
  }
}


export class PluginContext {
  private handlers: FileHandler[] = [];
  public tags: Record<string, CustomTag> = {};

  constructor(plugins: Plugin[]) {
    for (const plugin of plugins) {
      this.handlers.push(...plugin.handlers);
      this.tags = Object.assign(this.tags, plugin.tags);
    }
  }

  public getFileHandler(content: PageData): FileHandler | null {
    for (const handler of this.handlers) {
      if (minimatch(content.path, handler.glob)) {
        return handler;
      }
    }
    return null;
  }
}
