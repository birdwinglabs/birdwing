import { RenderableTreeNode, Tag } from "@markdoc/markdoc";

export { GridFlow, gridLayout, gridItems, flow } from './grid.js';

export interface SplitLayoutOptions {
  split: number[],
  mirror: boolean,
  main: RenderableTreeNode[],
  side: RenderableTreeNode[],
}

export function splitLayout(options: SplitLayoutOptions) {
  const { main, side, split, mirror } = options;
  const columns = split.reduce((cols, c) => cols + c, 0);

  if (split && split.length === 2) {
    return new Tag('div', { 'data-name': 'layout', 'data-layout': 'grid', 'data-columns': columns }, [
      new Tag('div', { 'data-colspan': split[mirror ? 1 : 0] }, mirror ? side : main),
      new Tag('div', { 'data-colspan': split[mirror ? 0 : 1] }, mirror ? main : side),
    ]);
  }

  return [...main, ...side];
}
