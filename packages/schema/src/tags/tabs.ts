import Markdoc, { Schema, Config, Ast, Node } from '@markdoc/markdoc';
import { createFactory, Factory, generateIdIfMissing, headingsToList, NodeList, tag } from '../util.js';
import { processBodyNodes } from '../common/page-section.js';
import { schema } from '@birdwing/renderable';
import { Group } from '../interfaces.js';
import { TabComponent } from '@birdwing/renderable/dist/schema/tabs.js';

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
    return new Tag('div', { id, property, typeof: 'TabGroup' }, [tabs, panels]);
  }
}

const isTabName = (n: Node, heading: number) => n.type === 'heading' && n.attributes.level === heading;

function tabFactory(config: Config) {
  return createFactory(schema.Tab, {
    tag: 'li',
    transforms: {
      heading: node => {
        const img = Array.from(node.walk()).find(n => n.type === 'image');
        const text = Array.from(node.walk()).filter(n => n.type === 'text');
        const span = new Tag('span', {}, Markdoc.transform(text, config));

        return img ? [ Markdoc.transform(img, config), span ] : span;
      }
    },
    properties: {
      name: tag({ match: 'span' }),
      image: tag({ match: 'svg' }),
    }
  });
}

function tabsGroup(factory: Factory<TabComponent>, heading: number, config: Config): Group {
  return {
    name: 'tabs',
    transforms: {
      item: node => {
        const children = node.children.filter(c => isTabName(c, heading));
        return factory.createTag(new Ast.Node('item', {}, children), config);
      },
    },
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
  attributes: {
    level: { type: Number, required: false, default: 1 }
  },
  transform(node, rootConfig) {
    generateIdIfMissing(node, rootConfig);
    const attr = node.transformAttributes(rootConfig);

    const isTabName = (n: Node) => n.type === 'heading' && n.attributes.level === attr.level


    const panelFactory = createFactory(schema.TabPanel, { tag: 'li' })


    const panelsGroup: Group = {
      name: 'panels',
      transforms: {
        item: node => {
          const children = node.children.filter(c => !(isTabName(c)));
          return panelFactory.createTag(new Ast.Node('item', {}, children), rootConfig);
        },
      },
    }

    //const tabGroupFactory = createFactory(schema.TabGroup, {
      //tag: 'div',
      //nodes: [
        //headingsToList(attr.level),
      //],
      //groups: [tabsGroup, panelsGroup],
    //});

    const fact = createFactory(schema.TabSection, {
      tag: 'section',
      nodes: [
        headingsToList(attr.level),
      ],
      groups: [
        {
          name: 'header',
          include: ['heading', 'paragraph']
        },
        {
          name: 'tabgroup',
          include: ['list'],
          facets: [
            tabsGroup(tabFactory(rootConfig), attr.level, rootConfig),
            panelsGroup,
          ],
          output: nodes => new Tag('div', {}, nodes),
        }
      ],
      properties: {
        headline: tag({ match: 'h1', group: 'header' }),
        tab: tag({ match: { tag: 'li', deep: true }, group: 'tabs' }),
        panel: tag({ match: { tag: 'li', deep: true }, group: 'panels' }),
      },
      refs: {
        tabs: tag({ match: 'ul', group: 'tabgroup' }),
      },
    })

    return fact.createTag(node, rootConfig);

    //const children = new NodeList(node.children);
    //const attr = node.transformAttributes(config);
    //const fact = new TabFactory(config);

    //if (node.children.find(c => c.type === 'hr')) {
      //const [ header, body ] = children.splitByHr();

      //processBodyNodes(header.body.all());

      //return new Tag('section', { property: 'contentSection', typeof: 'TabSection' }, [
        //new Tag('header', {}, header.body.transformFlat(config)),
        //fact.createTabGroup(attr['id'], 'tabs', body.body) 
      //]);
    //}

    //return fact.createTabGroup(attr['id'], 'contentSection', new NodeList(node.children));
  }
}
