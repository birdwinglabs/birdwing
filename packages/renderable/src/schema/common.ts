import { ComponentType } from "../interfaces";

export class LinkItem {
  url: string = '';
  name: string = '';
}

export interface LinkItemComponent extends ComponentType<LinkItem> {
  tag: 'li',
  properties: {
    name: 'span',
    url: 'a',
  },
  refs: {},
}
