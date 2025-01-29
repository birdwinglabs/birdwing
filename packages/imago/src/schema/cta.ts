import { ComponentType } from "../interfaces";

export class Action {
  url: string = '';
  name: string = '';
}

export class CallToAction {
  action: Action[] = [];
}

export interface ActionComponent extends ComponentType<Action> {
  tag: 'li',
  properties: {
    name: 'span',
    url: 'a',
  },
  slots: {},
}

export interface CallToActionComponent extends ComponentType<CallToAction> {
  tag: 'section',
  properties: {
    action: 'li',
  },
  slots: {
    layout: 'div',
    body: 'section',
    actions: 'section',
    showcase: 'div',
  }
}
