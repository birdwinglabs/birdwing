import Markdoc, { Node, Schema, Tag } from "@markdoc/markdoc";
import { TransformConfig, Transformer } from '@birdwing/core';

const { Tag: MarkdocTag } = Markdoc;

function isUppercase(word: string){
  return /^\p{Lu}/u.test(word);
}

function applyNamespace(tag: any, component?: string) {
  if (!isUppercase(tag.name) && component) {
    tag.name = `${component}.${tag.name}`;
  } else {
    component = tag.name;
  }
  for (const [slot, attr] of Object.entries(tag.attributes || {})) {
    if (MarkdocTag.isTag(attr)) {
      applyNamespace(attr, `${component}.${slot}`);
    }
    if (Array.isArray(attr)) {
      for (const child of attr) {
        if (MarkdocTag.isTag(child)) {
          applyNamespace(child, `${component}.${slot}`);
        }
      }
    }
  }
  for (const child of tag.children || []) {
    if (MarkdocTag.isTag(child)) {
      applyNamespace(child, component);
    }
  }

  return tag;
}


export class MarkdocTransformer implements Transformer {
  public readonly urlMap: Record<string, string> = {};

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

  setPartial(path: string, ast: Node) {
    this.partials[path] = ast;
  }

  setVariable(name: string, value: any) {
    this.variables[name] = value;
  }

  transform(ast: Node, config: TransformConfig): Tag {
    Object.assign(config.variables || {}, this.variables, {
      urls: this.urlMap,
      ast: ast,
    });

    const tag = Markdoc.transform(ast, {
      tags: this.tags,
      nodes: { ...this.nodes, document: this.documents[config.node] },
      partials: this.partials,
      variables: config.variables,
    }) as any;

    return applyNamespace(tag);
  }
}
