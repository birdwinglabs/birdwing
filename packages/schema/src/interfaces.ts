import { RenderableTreeNode, Tag } from "@markdoc/markdoc";

export abstract class Layout {
  constructor(public readonly container: Tag) {}

  abstract pushContent(name: string, nodes: RenderableTreeNode[]): Layout;
}
