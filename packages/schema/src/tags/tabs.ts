import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';

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
      return new Tag('tabpanel', {}, body.transformFlat(config));
    });
    const attributes = { ...node.transformAttributes(config), tabs };

    return new Tag(this.render, attributes, panels);
  }
}
