import Markdoc, { Schema, Node, Config } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';

const { Tag } = Markdoc;

const isIcon = (tag: any) => tag instanceof Tag && tag.name === 'svg' || tag.name === 'image';

export class TabFactory {
  constructor(private tabName: string, private panelName: string, private config: Config) {}

  createTabs(section: NodeList, headingLevel?: number) {
    const tabSections = section.headingSections(headingLevel);
    const tabs = tabSections.map(({ heading }) => {
      const tags = heading.transformChildren(this.config);

      return new Tag(this.tabName, { icon: tags.find(isIcon) }, tags.filter(t => !isIcon(t)));
    });
    const panels = tabSections.map(({ body }) => {
      return new Tag(this.panelName, {}, body.transformFlat(this.config));
    });
    return { tabs, panels };
  }
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
    generateIdIfMissing(node, config);
    const fact = new TabFactory('Tab', 'TabPanel', config);

    return new Tag(this.render, {
      ...node.transformAttributes(config),
      ...fact.createTabs(new NodeList(node.children)),
    });
  }
}
