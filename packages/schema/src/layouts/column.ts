import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { ContentOptions, Layout } from "../interfaces";

export interface ColumnLayoutConfig {
  name?: string

  columns: number;

  fractions: string;

  mirror: boolean;
}

export class ColumnLayout extends Layout {
  private fractions: number[];
  private mirror: boolean;

  constructor({ columns, fractions, mirror, ...attr }: ColumnLayoutConfig) {
    super(new Tag('div', { 'data-name': attr.name, 'data-layout': 'grid' }, []));
    this.fractions = fractions.split(' ').map(v => parseInt(v)).slice(0, columns);
    this.mirror = mirror;
    this.container.attributes['data-columns'] = this.fractions.reduce((acc, c) => acc + c);
  }

  pushContent(nodes: RenderableTreeNode[], {name, ...options}:ContentOptions) {
    const children = this.container.children;
    const i = children.length;
    const n = this.fractions.length;

    if (i < n) {
      children.push(new Tag('div', {
        ...options,
        'data-name': name,
        'data-colspan': this.fractions[i],
        'data-order': this.mirror ? n - i : i + 1 },
        nodes
      ));
    }
    return this;
  }
}
