import { Layout } from "../interfaces";
import { ColumnLayout } from "./column";
import { GridLayout, GridLayoutConfig } from "./grid";
import { StackLayout } from "./stack";

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
