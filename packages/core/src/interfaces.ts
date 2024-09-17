import { Node, Tag, Schema } from "@markdoc/markdoc";
import { resolvePageUrl } from "./util.js";
import { Plugin } from "./plugin.js";

export interface AppConfig {
  theme?: string;

  content: ContentMountPoint[];

  variables: Record<string, any>;
}

export interface SourceDocument {
  _id: string;

  frontmatter: Record<string, any>;

  path: string;

  body: string;
}

export abstract class AbstractDocument {
  abstract readonly type: string;

  constructor(
    public readonly path: string,
    public readonly frontmatter: Record<string, any>,
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

export interface Route<T extends Record<string, any> = Record<string, any>> {
  source: string;

  url: string;

  title: string;

  tag: Tag<string, T>;
}

export interface ContentMountPoint {
  plugin: string;

  path: string;
}

export interface TargetFile {
  _id: string;

  content: string;
}

export interface TransformConfig {
  node: string;

  variables?: Record<string, any>;

  path?: string
}

export interface Transformer {
  readonly urlMap: Record<string, string>;

  linkPath(path: string, url: string): void;

  unlinkPath(path: string): void;

  setPartial(path: string, ast: Node): void;

  transform(ast: Node, config: TransformConfig): Tag;
}

export interface Theme {
  tags: Record<string, Schema>;
  nodes: Record<string, Schema>;
  documents: Record<string, Schema>;
  plugins: Plugin[];
}
