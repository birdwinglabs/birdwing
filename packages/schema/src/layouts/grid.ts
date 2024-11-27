import { RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { Layout } from "../interfaces";

export interface GridLayoutConfig {
  name?: string;
  columns?: number;
  rows?: number;
  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
  tiles: string;
}

export interface GridTileConfig {
  colspan?: number
  rowspan?: number
}

export class GridLayout extends Layout {
  private tiles: GridTileConfig[];

  constructor({ name, columns, rows, flow, tiles }: GridLayoutConfig) {
    super(new Tag('grid', { name, columns, rows, flow }));
    this.tiles = tiles.split(' ').map(e => {
      const [c, r] = e.split(':');
      return {
        colspan: parseInt(c),
        rowspan: r ? parseInt(r) : undefined ,
      }
    })
  }

  pushContent(name: string, nodes: RenderableTreeNode[]) {
    const children = this.container.children;

    children.push(new Tag('tile', { name, ...this.tiles[children.length] }, nodes));
  }
}
