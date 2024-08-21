import { Route } from "./interfaces.js";
import { Page } from "./page.js";
import { Fragment } from "./fragment.js";
import { Transformer } from "./transformer.js";
import { Document } from "@tashmet/tashmet";
import { FileNode } from "./loader.js";
import { Schema } from "@markdoc/markdoc";


export class TransformResult {
  constructor(
    public readonly changeType: 'content' | 'attributes',
    public pages: Page[],
    public fragments: Fragment[]
  ) {}

  compileRoutes() {
    return Promise.all(this.pages.map(p => this.createRoute(p)));
  }

  private async createRoute(page: Page): Promise<Route> {
    return { _id: page.url, url: page.url, tag: await page.compile(this.fragments) };
  }
}

export class Compiler {
  private transformer: Transformer;
  private nodes: Record<string, { loaded: FileNode, transformed: Page | Fragment | undefined }> = {};

  constructor(nodes: FileNode[], tags: Record<string, Schema>) {
    this.transformer = new Transformer(tags);
    for (const node of nodes) {
      this.nodes[node.path] = { loaded: node, transformed: undefined };
      this.transformer.linkPath(node.path, node.url);
    }
  }

  pushNode(node: FileNode) {
    const t = node.transform(this.transformer);
    this.nodes[node.path] = { loaded: node, transformed: t };

    if (t instanceof Page) {
      return new TransformResult('content', [t], this.fragments);
    } else {
      return new TransformResult('attributes', this.pages, this.fragments);
    }
  }

  private get pages(): Page[] {
    return Object.values(this.nodes)
      .map(n => n.transformed)
      .filter(t => t instanceof Page) as Page[];
  }

  private get fragments(): Fragment[] {
    return Object.values(this.nodes)
      .map(n => n.transformed)
      .filter(t => t instanceof Fragment) as Fragment[]
  }

  transform() {
    for (const { loaded } of Object.values(this.nodes)) {
      this.nodes[loaded.path].transformed = loaded.transform(this.transformer);
    }
    return new TransformResult('content', this.pages, this.fragments);
  }
}

export interface ContentTarget {
  mount(route: Route): void;

  mountAttributes(url: string, attributes: Document): void;

  unmount(url: string): void;
}
