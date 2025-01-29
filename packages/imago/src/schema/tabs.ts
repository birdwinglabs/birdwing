import { ComponentType } from "../interfaces";

export class TabGroup {
  tab: Tab[] = [];
  panel: TabPanel[] = [];
}

export interface TabGroupComponent extends ComponentType<TabGroup> {
  tag: 'section',
  properties: {
    tab: 'li',
    panel: 'li',
  },
  refs: {
    tabs: 'ul',
    panels: 'ul',
  }
}

export class TabPanel {}

export interface TabPanelComponent extends ComponentType<TabPanel> {
  tag: 'li',
  properties: {},
}

export class Tab {
  name: string = '';
  image: string | undefined = undefined;
}

export interface TabComponent extends ComponentType<Tab> {
  tag: 'li',
  properties: {
    name: 'h1',
    image: 'img' | 'svg',
  }
}
