import Markdoc, { Ast, Node, Tag, RenderableTreeNodes, RenderableTreeNode } from '@markdoc/markdoc';
import { headingsToList } from '../util.js';
import { schema } from '@birdwing/renderable';
import { NodeStream } from '../lib/node.js';
import { attribute, group, id, Model, createComponentRenderable, createSchema } from '../lib/index.js';
import { RenderableNodeCursor } from '../lib/renderable.js';
import { pageSectionProperties } from './common.js';

class TabModel extends Model {
  @attribute({ type: String, required: true })
  name: string;

  @attribute({ type: String, required: false })
  image: string;

  transform(): RenderableTreeNodes {
    let tab = new RenderableNodeCursor<RenderableTreeNode>([]);

    if (this.image) {
      tab = tab.concat(Markdoc.transform(new Ast.Node('image', { src: this.image }), this.config));
    }

    tab = tab.concat(new Tag('span', {}, [this.name]));

    const panel = this.transformChildren();

    const name = tab.tag('span');
    const image = tab.tag('svg');

    return [
      createComponentRenderable(schema.Tab, {
        tag: 'li',
        properties: { name, image },
        children: tab.toArray(),
      }),
      createComponentRenderable(schema.TabPanel, {
        tag: 'li',
        properties: {},
        children: panel.toArray(),
      })
    ];
  }
}

export const tab = createSchema(TabModel);

class TabsModel extends Model {
  @id({ generate: true })
  id: string;

  @attribute({ type: Number, required: false })
  headingLevel: number | undefined = undefined;

  @group({ include: ['heading', 'paragraph'] })
  header: NodeStream;

  @group({ include: ['tag'] })
  tabgroup: NodeStream;

  convertHeadings(nodes: Node[]) {
    const converted = headingsToList({ level: this.headingLevel })(nodes);
    const n = converted.length - 1;
    const tags = converted[n].children.map(item => {
      const heading = item.children[0];
      const image = Array.from(heading.walk()).find(n => n.type === 'image');
      const name = Array.from(heading.walk()).filter(n => n.type === 'text').map(t => t.attributes.content);
      return new Ast.Node('tag', {
        name,
        image: image ? image.attributes.src : undefined,
      }, item.children.slice(1), 'tab');
    });

    converted.splice(n, 1, ...tags);

    return converted;
  }

  processChildren(nodes: Node[]) {
    if (this.headingLevel !== undefined) {
      return super.processChildren(this.convertHeadings(nodes));
    }
    return super.processChildren(nodes);
  }

  transform(): RenderableTreeNodes {
    const header = this.header.transform();
    const tabStream = this.tabgroup.transform();

    const tabs = tabStream.tag('li').typeof('Tab');
    const panels = tabStream.tag('li').typeof('TabPanel')
    
    const tabList = tabs.wrap('ul');
    const panelList = panels.wrap('ul');

    const children = header.count() > 0
      ? [header.wrap('header').next(), tabList.next(), panelList.next()]
      : [tabList.next(), panelList.next()];

    return createComponentRenderable(schema.TabGroup, {
      tag: 'section',
      id: this.id,
      class: this.node.transformAttributes(this.config).class,
      property: 'contentSection',
      properties: {
        ...pageSectionProperties(header),
        tab: tabs,
        panel: panels,
      },
      refs: { tabs: tabList, panels: panelList },
      children,
    });
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
export const tabs = createSchema(TabsModel);
