import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { ContentOptions, Layout } from "../interfaces";

export class StackLayout extends Layout {
  constructor(attr: Record<string, any>) {
    super(new Tag('section', attr, []));
  }

  pushContent(nodes: RenderableTreeNode[], options: ContentOptions) {
    this.container.children.push(new Tag('section', options, nodes));
    return this;
  }
}
