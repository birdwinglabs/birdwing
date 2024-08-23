import { Schema } from "@markdoc/markdoc";
import { FragmentNode } from "./fragment.js";
import { ContentTransform, FragmentConfig, PageData } from "./interfaces.js";
import { FileHandler } from "./loader.js";
import { PageNode } from "./page.js";

export class Plugin {
  constructor(
    public handlers: Record<string, FileHandler> = {},
    public tags: Record<string, Schema> = {},
  ) {}

  page(type: string, config: (doc: PageData) => ContentTransform) {
    this.handlers[type] = (content: PageData) =>
      new PageNode(type, content.ast, content.path, config(content));
    return this;
  }

  fragment(type: string, config: (doc: PageData) => FragmentConfig) {
    this.handlers[type] = (content: PageData) =>
      new FragmentNode(type, content.ast, content.path, config(content));
    return this;
  }
}

export class PluginContext {
  public handlers: Record<string, FileHandler> = {};

  constructor(plugins: Plugin[]) {
    for (const plugin of plugins) {
      this.handlers = Object.assign(this.handlers, plugin.handlers);
    }
  }
}
