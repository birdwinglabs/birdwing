import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { ContentOptions, Layout } from "../interfaces";

export interface GridLayoutConfig {
  name?: string;
  property?: string;
  typeof?: string;
  columns?: number;
  rows?: number;
  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  items: string;
}

export interface GridTileConfig {
  colspan?: number
  rowspan?: number
}

export class GridLayout extends Layout {
  private tiles: GridTileConfig[];

  constructor({ items, name, property, columns, rows, flow, ...attr  }: GridLayoutConfig) {
    super(new Tag('div', {
      'data-layout': 'grid',
      'data-name': name,
      property,
      typeof: attr.typeof,
      'data-columns': columns,
      'data-rows': rows,
      'data-flow': flow,
    }));
    this.tiles = items.split(' ').map(e => {
      const [c, r] = e.split(':');
      return {
        colspan: parseInt(c),
        rowspan: r ? parseInt(r) : undefined ,
      }
    })
  }

  pushContent(nodes: RenderableTreeNode[], {name, ...options}: ContentOptions) {
    const children = this.container.children;
    const tile = this.tiles[children.length];

    children.push(new Tag('div', {
      ...options,
      'data-name': name,
      'data-colspan': tile.colspan,
      'data-rowspan': tile.rowspan,
    }, nodes));
    return this;
  }
}
