import { Layout } from "../interfaces";
import { ColumnLayout } from "./column";
import { GridLayout, GridLayoutConfig } from "./grid";
import { StackLayout } from "./stack";

export function createLayout(name: string, attr: Record<string, any>): Layout {
  switch (attr['layout']) {
    case 'grid':
      return new GridLayout({ name, ...attr as GridLayoutConfig });
    case '2-column':
      return new ColumnLayout({ name, columns: 2, fractions: attr['fractions'], mirror: false });
    case '2-column-mirror':
      return new ColumnLayout({ name, columns: 2, fractions: attr['fractions'], mirror: true });
    case 'stack':
    default:
      return new StackLayout(name);
  }
}
