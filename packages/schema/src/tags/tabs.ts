import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

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
    const children = new NodeList(node.children)
      .headingSections()
      .map(({ heading, body }) =>
        new Tag('tab', { head: Markdoc.transform(heading, config) }, body.transformFlat(config))
      );

    return new Tag(this.render, node.transformAttributes(config), children);
  }
}
