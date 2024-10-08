import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';
import { RenderFunction, Template, TemplateNodeConfig } from '@birdwing/react';

const { Tag } = Markdoc;

/**
 * Tabs component
 * 
 * Turns level 1 headings into tabs
 * 
 * @example
 * 
 * ```markdoc
 * {% tabs %}
 * # Tab 1
 * Content for tab 1
 * 
 * # Tab 2
 * Content for tab 2
 * {% /tabs %}
 * ```
 */
export const tabs: Schema = {
  render: 'Tabs',
  transform(node, config) {
    generateIdIfMissing(node, config);

    const sections = new NodeList(node.children).headingSections();
    const tabs = sections.map(({ heading }) => {
      return new Tag('tab', {}, heading.transformChildren(config));
    });
    const panels = sections.map(({ body }) => {
      return new Tag('panel', {}, body.transformFlat(config));
    });
    const attributes = { ...node.transformAttributes(config), tabs, panels };

    return new Tag(this.render, attributes);
  }
}

export interface TabsConfig {
  layout: RenderFunction<any>;
  slots: {
    tabs: TemplateNodeConfig;
    panels: TemplateNodeConfig;
  },
  nodes: {
    tab: RenderFunction<any>,
    panel: RenderFunction<any>,
  }
}

export class Tabs extends Template<any> {
  constructor({ layout, slots, nodes }: TabsConfig) {
    super({ name: 'Tabs', layout, nodes, slots })
  }
}
