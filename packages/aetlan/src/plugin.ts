import { Schema } from "@markdoc/markdoc";
import { FragmentFileHandler } from "./fragment.js";
import { ContentTransform, FragmentConfig, PageData } from "./interfaces.js";
import { FileHandler } from "./loader.js";
import { PageFileHandler } from "./page.js";
import minimatch from 'minimatch';

export class Plugin {
  constructor(
    public handlers: FileHandler[] = [],
    public tags: Record<string, Schema> = {},
  ) {}

  page(glob: string, config: (doc: PageData) => ContentTransform) {
    this.handlers.push(new PageFileHandler(glob, config));
    return this;
  }

  fragment(glob: string, config: (doc: PageData) => FragmentConfig) {
    this.handlers.push(new FragmentFileHandler(glob, config));
    return this;
  }

  tag(name: string, tag: Schema) {
    this.tags[name] = tag;
    return this;
  }
}


export class PluginContext {
  private handlers: FileHandler[] = [];
  public tags: Record<string, Schema> = {};

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
