import { ComponentType } from "../interfaces";
import { PageSection } from "./page";

export class Action {
  url: string = '';
  name: string = '';
}

export class CallToAction extends PageSection {
  action: Action[] = [];
}

export interface ActionComponent extends ComponentType<Action> {
  tag: 'li',
  properties: {
    name: 'span',
    url: 'a',
  },
  refs: {},
}

export interface CallToActionComponent extends ComponentType<CallToAction> {
  tag: 'section',
  properties: {
    name: 'p',
    headline: 'h1',
    description: 'p',
    action: 'li',
  },
  refs: {
    layout: 'div',
    body: 'section',
    actions: 'section',
    showcase: 'div',
  }
}
