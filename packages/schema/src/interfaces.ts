import { RenderableTreeNode, Tag } from "@markdoc/markdoc";

export abstract class Layout {
  constructor(public readonly container: Tag) {}

  abstract pushContent(nodes: RenderableTreeNode[]): void;
}
