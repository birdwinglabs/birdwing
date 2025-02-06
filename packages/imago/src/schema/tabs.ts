import { ComponentType } from "../interfaces";
import { PageSection, PageSectionProperties } from "./page";

export class TabGroup {
  tab: Tab[] = [];
  panel: TabPanel[] = [];
}

export interface TabGroupComponent extends ComponentType<TabGroup> {
  tag: 'div',
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

export class TabSection extends PageSection {
  tabs: TabGroup = new TabGroup();
}

export interface TabSectionProperties extends PageSectionProperties {
  tabs: 'div',
}

export interface TabSectionComponent extends ComponentType<TabSection> {
  tag: 'section',
  properties: TabSectionProperties,
}
