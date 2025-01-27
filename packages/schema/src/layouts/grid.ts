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

  constructor({ items, ...attr }: GridLayoutConfig) {
    super(new Tag('grid', attr));
    this.tiles = items.split(' ').map(e => {
      const [c, r] = e.split(':');
      return {
        colspan: parseInt(c),
        rowspan: r ? parseInt(r) : undefined ,
      }
    })
  }

  pushContent(nodes: RenderableTreeNode[], options: ContentOptions) {
    const children = this.container.children;

    children.push(new Tag('tile', { ...options, ...this.tiles[children.length] }, nodes));
    return this;
  }
}
