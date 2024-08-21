import Markdoc, { Node, Schema, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';

import { ContentTransform } from "./interfaces.js";

export class Transformer {
  private urlMap: Record<string, string> = {};

  constructor(
    private customTags: Record<string, Schema>,
  ) {}

  linkPath(path: string, url: string) {
    this.urlMap[path] = url;
  }

  unlinkPath(path: string) {
    delete this.urlMap[path];
  }

  transform(ast: Node, config: ContentTransform, extraVars: Document) {
    const { tags: tagnames, nodes, render } = config;

    const tags = tagnames.reduce((tags, name) => {
      tags[name] = this.customTags[name];
      return tags;
    }, {} as Record<string, Schema>);

    const variables = {
      context: render,
      urls: this.urlMap,
      ...extraVars,
    }

    return {
      tag: Markdoc.transform(ast, { tags, nodes, variables }) as Tag,
      variables,
    }
  }
}
