import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { Layout } from "../interfaces";

export class StackLayout extends Layout {
  constructor(name?: string) {
    super(new Tag('section', { name }, []));
  }

  pushContent(name: string, nodes: RenderableTreeNode[]): void {
    this.container.children.push(new Tag('section', { name }, nodes));
  }
}
