import { Ast, Node, RenderableTreeNodes } from '@markdoc/markdoc';
import { createComponentRenderable, createSchema, group, Model } from '../lib';
import { NodeStream } from '../lib/node';
import { headingsToList } from '../util';
import { schema } from '@birdwing/renderable';
import { gridLayout } from '../layouts';
import { RenderableNodeCursor } from '../lib/renderable';


class FooterModel extends Model {
  @group({ section: 0, include: ['heading', 'paragraph'] })
  header: NodeStream;

  @group({ section: 0, include: ['tag'] })
  topics: NodeStream;

  @group({ section: 0, include: ['paragraph'] })
  copyright: NodeStream;

  processChildren(nodes: Node[]) {
    const n = headingsToList({ level: 2, include: ['list'] })(nodes);

    const topicsIndex = n.findIndex(c => c.type === 'list');

    if (topicsIndex >= 0) {
      const topics = n[topicsIndex].children.map(item => new Ast.Node('tag', {}, item.children, 'topic'));
      console.log(n.slice(topicsIndex + 1));
      return super.processChildren([...n.slice(0, topicsIndex), ...topics, ...n.slice(topicsIndex + 1)]);
    }
    return super.processChildren(n);
  }

  transform(): RenderableTreeNodes {
    const header = this.header.transform();
    const topics = this.topics.transform();
    const copyright = this.copyright.transform();

    const grid = gridLayout({
      columns: topics.count(),
      items: topics.toArray().map(topic => {
        return { colspan: 1, children: new RenderableNodeCursor([topic]) };
      })
    })

    return createComponentRenderable(schema.Footer, {
      tag: 'footer',
      property: 'footer',
      properties: {
        //headline: header.tag('h1'),
        topic: topics.tag('div'),
        copyright: copyright.tag('p'),
      },
      children: [...header.toArray(), grid, ...copyright.toArray()],
    })
  }
}

export const footer = createSchema(FooterModel);
