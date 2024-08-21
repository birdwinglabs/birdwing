import Markdoc, { Node, Schema, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';

import { ContentTransform } from "./interfaces.js";

export class Transformer {
  private urlMap: Record<string, string> = {};

  constructor(
    private tags: Record<string, Schema>,
  ) {}

  linkPath(path: string, url: string) {
    this.urlMap[path] = url;
  }

  unlinkPath(path: string) {
    delete this.urlMap[path];
  }

  transform(ast: Node, config: ContentTransform, extraVars: Document) {
    const variables = {
      urls: this.urlMap,
      ...extraVars,
    }

    return {
      tag: Markdoc.transform(ast, { tags: this.tags, nodes: config.nodes, variables }) as Tag,
      variables,
    }
  }
}
