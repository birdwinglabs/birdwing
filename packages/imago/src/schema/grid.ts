import { ComponentType } from "../interfaces";

export class Grid {}

export interface GridComponent extends ComponentType<Grid> {
  tag: 'section',
  properties: {},
  slots: {
    item: 'div',
  },
}
