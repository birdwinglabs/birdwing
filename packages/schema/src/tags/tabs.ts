import Markdoc, { Schema, Node } from '@markdoc/markdoc';
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

    const isIcon = (tag: any) => tag instanceof Tag && tag.name === 'svg' || tag.name === 'image';

    const sections = new NodeList(node.children).headingSections();
    const tabs = sections.map(({ heading }) => {
      const tags = heading.transformChildren(config);

      return new Tag('Tab', { icon: tags.find(isIcon) }, tags.filter(t => !isIcon(t)));
    });
    const panels = sections.map(({ body }) => {
      return new Tag('TabPanel', {}, body.transformFlat(config));
    });
    const attributes = { ...node.transformAttributes(config), tabs, panels };

    return new Tag(this.render, attributes);
  }
}
