import { PageData } from "./interfaces.js";
import { Page } from "./page.js";
import { Fragment } from "./fragment.js";
import { PluginContext } from "./plugin.js";
import { Transformer } from "./transformer.js";

export interface FileNode {
  path: string;

  url: string;

  transform(transformer: Transformer): Page | Fragment;
}

export interface FileHandler {
  glob: string;

  createNode(content: PageData): FileNode;
}


export class ContentLoader {
  constructor(private pluginContext: PluginContext) {}

  load(content: PageData): FileNode {
    const handler = this.pluginContext.getFileHandler(content);

    if (!handler) {
      throw Error('No handler for content');
    }

    return handler.createNode(content)
  }
}
