import Markdoc, { Schema, Node } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export interface Tab {
  index: number;

  head: Node;

  body: Node[];
}

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
    const tabIdxs: number[] = [];

    node.children.forEach((child, index) => {
      if (child.type === 'heading' && child.attributes.level === 1) {
        tabIdxs.push(index);
      }
    });

    const tabs: Tab[] = tabIdxs.map((val, index) => {
      return {
        index,
        head: node.children[val],
        body: node.children.slice(val + 1, tabIdxs[index + 1])
      }
    });

    const heads = tabs.map(t => Markdoc.transform(t.head, config));

    const createTab = ({ body, index }: Tab) => {
      return new Tag('tab', { index }, Markdoc.transform(body, config));
    }

    return new Tag(this.render, { heads }, tabs.map(tab => createTab(tab)));
  }
}
