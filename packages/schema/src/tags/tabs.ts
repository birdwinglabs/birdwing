import Markdoc, { Schema, Config } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';

const { Tag } = Markdoc;

export class TabFactory {
  constructor(private config: Config) {}

  createTabs(section: NodeList, headingLevel?: number) {
    const tabSections = section.headingSections(headingLevel);
    const tabs = tabSections.map(({ heading }) => {
      const tab = new Tag('li', { property: 'tab', typeof: 'Tab' });

      for (const c of heading.children[0].children) {
        if (c.type === 'text') {
          tab.children.push(new Tag('h1', { property: 'name' }, [Markdoc.transform(c, this.config)]));
        } else if (c.type === 'image') {
          c.attributes.property = 'image';
          const tag = Markdoc.transform(c, this.config);
          tab.children.push(tag );
        }
      }
      return tab;

      //return new Tag('item', { property: 'tab', typeof: 'Tab' }, [
        //new Tag('heading', { level: 1, property: 'name' }, heading.transformChildren(this.config))
      //]);
    });
    const panels = tabSections.map(({ body }) => {
      return new Tag('li', { property: 'panel', typeof: 'TabPanel' }, body.transformFlat(this.config));
    });
    return {
      tabs: new Tag('ul', { 'data-name': 'tabs' }, tabs),
      panels: new Tag('ul', { 'data-name': 'panels' }, panels),
    };
  }

  createTabGroup(id: string, property: string, section: NodeList, headingLevel?: number) {
    const { tabs, panels } = this.createTabs(section, headingLevel);
    return new Tag('section', { id, property, typeof: 'TabGroup' }, [tabs, panels]);
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
  transform(node, config) {
    generateIdIfMissing(node, config);
    const attr = node.transformAttributes(config);
    const fact = new TabFactory(config);

    //return new Tag(this.render, {}, [fact.createTabGroup(attr['id'], new NodeList(node.children))]);
    return fact.createTabGroup(attr['id'], 'contentSection', new NodeList(node.children));
  }
}
