import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { ContentOptions } from "../interfaces.js";
import { Layout } from "./common.js";

export class StackLayout extends Layout {
  constructor(attr: Record<string, any>) {
    super(new Tag('div', { 'data-name': attr.name }, []));
  }

  pushContent(nodes: RenderableTreeNode[], { name, ...rest }: ContentOptions) {
    this.container.children.push(new Tag('div', { 'data-name': name, ...rest }, nodes));
    return this;
  }
}
