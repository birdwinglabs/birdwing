import { FragmentNode } from "./fragment.js";
import { ContentTransform, FragmentConfig, PageData } from "./interfaces.js";
import { FileHandlerConfig } from "./loader.js";
import { PageNode } from "./page.js";

export class Plugin {
  public handlers: FileHandlerConfig[] = [];

  constructor(public name: string) {}

  page(name: string, match: string, config: (mountPath: string, doc: PageData) => ContentTransform) {
    this.handlers.push({
      name,
      type: 'page',
      match,
      handler: (mountPath: string, content: PageData) =>
        new PageNode(name, content.ast, content.path, config(mountPath, content)),
    });
    return this;
  }

  fragment(name: string, match: string, config: (mountPath: string, doc: PageData) => FragmentConfig) {
    this.handlers.push({
      name,
      type: 'fragment',
      match,
      handler: (mountPath: string, content: PageData) =>
        new FragmentNode(name, content.ast, content.path, config(mountPath, content)),
    });
    return this;
  }
}
