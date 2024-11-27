import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { Layout } from "../interfaces";

export interface ColumnLayoutConfig {
  name?: string

  columns: number;

  fractions: string;

  mirror: boolean;
}

export class ColumnLayout extends Layout {
  private fractions: number[];
  private mirror: boolean;

  constructor({ name, columns, fractions, mirror }: ColumnLayoutConfig) {
    super(new Tag('grid', { name }, []));
    this.fractions = fractions.split(' ').map(v => parseInt(v)).slice(0, columns);
    this.mirror = mirror;
    this.container.attributes.columns = this.fractions.reduce((acc, c) => acc + c);
  }

  pushContent(name: string, nodes: RenderableTreeNode[]): void {
    const children = this.container.children;
    const i = children.length;
    const n = this.fractions.length;

    if (i < n) {
      children.push(new Tag('tile', { name, colspan: this.fractions[i], order: this.mirror ? n - i : i + 1 }, nodes));
    }
  }
}
