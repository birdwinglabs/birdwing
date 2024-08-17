import markdoc, { Node, RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { Document } from "@tashmet/tashmet";

export interface RenderableDocument {
  _id: string;

  renderable: any;
}

export interface PageData {
  _id: string;

  path: string;

  body: string;

  ast: Node;

  renderable: RenderableTreeNode | undefined;

  frontmatter: Document;
}

export abstract class Page {
  constructor(protected page: PageData, protected root: string) {}

  nodes: Document = {};
  tags: Document = {};
  abstract context: string;

  get id() {
    return this.page._id;
  }

  get path() {
    return this.page.path;
  }

  abstract get url(): string;

  async data(fragments: Document) {
    return this.page.frontmatter;
  }

  transform(urls: Record<string, string>) {
    return markdoc.transform(this.page.ast, {
      tags: this.tags,
      nodes: this.nodes,
      variables: {
        context: this.context,
        urls,
        path: this.root,
      }
    });
  }
}

export interface Route {
  _id: string;

  url: string;

  tag: Tag;
}

export abstract class Fragment {
  abstract name: string;

  abstract path: string;
}

export interface FileHandler {
  glob: string;
}

export class FragmentFileHandler<T extends Fragment = Fragment> implements FileHandler {
  constructor(
    public readonly glob: string,
    public createFragment: (doc: PageData, urls: Record<string, string>) => Promise<T>
  ) {}
}

export class PageFileHandler implements FileHandler  {
  constructor(
    public readonly glob: string,
    public createPage: (doc: PageData) => Promise<Page>
  ) {}
}

export type PluginFactory = (config: any) => Plugin

export class Plugin {
  constructor(
    public handlers: FileHandler[] = [],
  ) {}

  page(glob: string, create: (doc: PageData) => Promise<Page>) {
    this.handlers.push(new PageFileHandler(glob, create));
    return this;
  }

  fragment(glob: string, create: (doc: PageData, urls: Record<string, string>) => Promise<Fragment>) {
    this.handlers.push(new FragmentFileHandler(glob, create));
    return this;
  }
}
