import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { RenderFunction, Template, TemplateNodeConfig } from '@birdwing/react';
import React from 'react';

const { Tag: TagCtr } = Markdoc;

export const cta: Schema = {
  render: 'CallToAction',
  transform(node, config) {
    const children = new NodeList(node.children);

    const { head, body, actions, side, footer } = children.commentSections(['head', 'body', 'actions', 'side', 'footer'], 'body');

    const attributes = {
      head: head.transformFlat(config),
      body: body.transformFlat(config),
      actions: actions.transformFlat(config),
      side: side.transformFlat(config),
      footer: footer.transformFlat(config),
    }

    return new TagCtr(this.render, attributes, []);
  }
}

//export interface CallToActionLayoutProps {
  //head?: React.ReactNode[];
  //body?: React.ReactNode[];
  //actions?: React.ReactNode[];
  //footer?: React.ReactNode[];
  //side?: React.ReactNode[];
//}

//export interface CallToActionConfig {
  //layout: RenderFunction<CallToActionLayoutProps>;
  //actions: Pick<TemplateNodeConfig, 'link' | 'list' | 'item' | 'fence'>;
  //head: TemplateNodeConfig;
  //body: TemplateNodeConfig;
  //footer: TemplateNodeConfig;
  //side: TemplateNodeConfig;
//}

//export class CallToAction extends Template<CallToActionLayoutProps> {
  //constructor({ layout, actions, head, body, footer, side }: CallToActionConfig) {
    //super({ name: 'CallToAction', layout, nodes: {}, slots: { head, body, actions, footer, side }})
  //}
//};
