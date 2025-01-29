import { ComponentType } from "../interfaces";

export class Grid {}

export interface GridComponent extends ComponentType<Grid> {
  tag: 'section',
  properties: {},
  refs: {
    item: 'div',
  },
}
