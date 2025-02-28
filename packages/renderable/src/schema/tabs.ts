import { ComponentType } from "../interfaces.js";
import { PageSection, PageSectionProperties } from "./page.js";

export interface Tabs {
  tab: Tab[];
  panel: TabPanel[];
}

export class TabGroup implements Tabs {
  tab: Tab[] = [];
  panel: TabPanel[] = [];
}

export interface TabGroupProperties {
  tab: 'li',
  panel: 'li',
}

export interface TabGroupComponent extends ComponentType<TabGroup> {
  tag: 'div',
  properties: TabGroupProperties,
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
    name: 'span',
    image: 'img' | 'svg',
  }
}

export class TabSection extends PageSection implements Tabs {
  tab: Tab[] = [];
  panel: TabPanel[] = [];
}

export interface TabSectionProperties extends PageSectionProperties {
  tab: 'li',
  panel: 'li',
}

export interface TabSectionComponent extends ComponentType<TabSection> {
  tag: 'section',
  properties: PageSectionProperties & TabGroupProperties,
  refs: {
    tabgroup: 'div',
    tabs: 'ul',
    panels: 'ul',
  }
}
