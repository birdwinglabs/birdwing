import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { ContentOptions } from "../interfaces.js";

export abstract class Layout {
  constructor(public readonly container: Tag) {}

  abstract pushContent(nodes: RenderableTreeNode[], options: ContentOptions): Layout;
}
