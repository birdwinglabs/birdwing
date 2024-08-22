import Markdoc, { Node, Schema } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';

import { ContentTransform } from "./interfaces.js";

const { Tag } = Markdoc;

function isUppercase(word: string){
  return /^\p{Lu}/u.test(word);
}

function applyNamespace(tag: any, component?: string) {
  if (!isUppercase(tag.name) && component) {
    tag.name = `${component}.${tag.name}`;
  } else {
    component = tag.name;
  }
  for (const attr of Object.values(tag.attributes || {})) {
    if (Tag.isTag(attr)) {
      applyNamespace(attr, component);
    }
    if (Array.isArray(attr)) {
      for (const child of attr) {
        if (Tag.isTag(child)) {
          applyNamespace(child, component);
        }
      }
    }
  }
  for (const child of tag.children || []) {
    if (Tag.isTag(child)) {
      applyNamespace(child, component);
    }
  }

  return tag;
}

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

    const tag = Markdoc.transform(ast, { tags: this.tags, nodes: config.nodes, variables }) as any;

    return {
      tag: applyNamespace(tag),
      variables,
    }
  }
}
