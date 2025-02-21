import { Layout } from "./common.js";
import { ColumnLayout } from "./column.js";
import { GridLayout, GridLayoutConfig } from "./grid.js";
import { StackLayout } from "./stack.js";
import { Projection } from "../interfaces.js";
import { RenderableTreeNode, RenderableTreeNodes, Tag } from "@markdoc/markdoc";

export function createLayout(attr: Record<string, any>): Layout {
  const { fractions, layout, ...restAttr } = attr;
  switch (layout) {
    case 'grid':
      return new GridLayout({ ...restAttr as GridLayoutConfig });
    case '2-column':
      return new ColumnLayout({ columns: 2, fractions, mirror: false, ...restAttr });
    case '2-column-mirror':
      return new ColumnLayout({ columns: 2, fractions, mirror: true, ...restAttr });
    case 'stack':
    default:
      return new StackLayout(restAttr);
  }
}

export interface SplitLayoutOptions {
  split: number[],
  mirror: boolean,
  main: RenderableTreeNode[],
  side: RenderableTreeNode[],
}

export function splitLayout(options: SplitLayoutOptions) {
  const { main, side, split, mirror } = options;
  const columns = split.reduce((cols, c) => cols + c, 0);

  return new Tag('div', { 'data-name': 'layout', 'data-layout': 'grid', 'data-columns': columns }, [
    new Tag('div', { 'data-colspan': split[mirror ? 1 : 0] }, mirror ? side : main),
    new Tag('div', { 'data-colspan': split[mirror ? 0 : 1] }, mirror ? main : side),
  ]);
  //const projection = {
    //tag: 'div',
    //attributes: { 'data-name': 'layout', 'data-layout': 'grid', 'data-columns': columns },
    //children: [
      //{
        //tag: 'div',
        //attributes: { 'data-colspan': split[0] },
        //children: main,
      //},
      //{
        //tag: 'div',
        //attributes: { 'data-colspan': split[1] },
        //children: side
      //},
    //]
  //};

  //if (mirror) {
    //projection.children.reverse();
  //}

  //return [projection];
}
