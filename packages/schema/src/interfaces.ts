import { RenderableTreeNode, Tag } from "@markdoc/markdoc";

export interface ContentOptions {
  name?: string;

  property?: string;

  typeof?: string;
}

export abstract class Layout {
  constructor(public readonly container: Tag) {}

  abstract pushContent(nodes: RenderableTreeNode[], options: ContentOptions): Layout;
}
