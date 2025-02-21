import { ComponentType } from "../interfaces.js";
import { PageSection, PageSectionProperties } from "./page.js";

export class LinkItem {
  url: string = '';
  name: string = '';
}

export class CallToAction extends PageSection {
  action: LinkItem[] = [];
}

export interface LinkItemComponent extends ComponentType<LinkItem> {
  tag: 'li',
  properties: {
    name: 'span',
    url: 'a',
  },
  refs: {},
}

export interface CallToActionProperties extends PageSectionProperties {
  action: 'li',
}

export interface CallToActionComponent extends ComponentType<CallToAction> {
  tag: 'section',
  properties: CallToActionProperties,
  refs: {
    layout: 'div',
    body: 'section',
    actions: 'section',
    showcase: 'div',
  }
}
