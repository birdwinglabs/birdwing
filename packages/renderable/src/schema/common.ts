import { ComponentType } from "../interfaces";

export class LinkItem {
  url: string = '';
  name: string = '';
}

export interface LinkItemComponent extends ComponentType<LinkItem> {
  tag: 'li',
  properties: {
    name: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
    url: 'a',
  },
  refs: {},
}
