import Markdoc, { Node, Schema } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';

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
    private nodes: Record<string, Schema>,
    private documents: Record<string, Schema>,
    private partials: Record<string, Node> = {},
    private variables: Record<string, any> = {}
  ) {}

  linkPath(path: string, url: string) {
    this.urlMap[path] = url;
  }

  unlinkPath(path: string) {
    delete this.urlMap[path];
  }

  transform(ast: Node, extraVars: Document) {
    const variables = {
      urls: this.urlMap,
      ...this.variables,
      ...extraVars,
    }

    const tag = Markdoc.transform(ast, {
      tags: this.tags,
      nodes: { ...this.nodes, document: this.documents[extraVars.document] },
      partials: this.partials,
      variables
    }) as any;

    return {
      tag: applyNamespace(tag),
      variables,
    }
  }
}
