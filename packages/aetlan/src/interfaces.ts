import { Node, Tag } from "@markdoc/markdoc";
import { Document } from "@tashmet/tashmet";
import { resolvePageUrl } from "./util.js";

export interface SourceDocument {
  _id: string;

  frontmatter: Document;

  path: string;

  body: string;
}

export abstract class AbstractDocument {
  abstract readonly type: string;

  constructor(
    public readonly path: string,
    public readonly frontmatter: Document,
    public readonly ast: Node
  ) {}

  get id(): string {
    return `${this.type}:${this.path}`
  }

  get partials(): string[] {
    const partials: string[] = [];
    for (const node of this.ast.walk()) {
      if (node.tag === 'partial') {
        partials.push(node.attributes.file);
      }
    }
    return partials;
  }
}

export class PartialDocument extends AbstractDocument {
  type = 'partial';
}

export class PageDocument extends AbstractDocument {
  type = 'page';

  get url(): string {
    return resolvePageUrl(this.path, this.frontmatter.slug)
  }
}

export class FragmentDocument extends AbstractDocument {
  type = 'fragment';

  get name(): string {
    const res = /^(?:.*[\/\\])?(.*)\.(.*)$/.exec(this.path);
    return res ? res[1].toLowerCase() : '';
  }
}


export class Route<T = any> {
  constructor(public tag: Tag, public url: string) {}
  
  setAttributes(attr: Partial<T>) {
    Object.assign(this.tag.attributes, attr);
  }
}

export interface ContentMountPoint {
  plugin: string;

  path: string;
}

export interface TargetFile {
  _id: string;

  content: string;
}
