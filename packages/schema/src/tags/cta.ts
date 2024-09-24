import Markdoc, { RenderableTreeNode, Tag, Schema } from '@markdoc/markdoc';
import { NodeList, TagList } from '../util';

const { Tag: TagCtr } = Markdoc;


function extractActions(body: RenderableTreeNode[]): Tag<'link'>[] | null {
  const lastParagraph = TagList.fromNodes(body).last();

  if (lastParagraph) {
    const children = TagList.fromNodes(lastParagraph.children);

    if (children.isEveryOfName('link')) {
      children.all().forEach((c, index) => {
        c.attributes['class'] = index === 0 ? 'primary' : 'secondary';
      });
      const links = children.byName('link');
      body.splice(body.length - 1);
      return links;
    }
  }
  return null;
}


export const cta: Schema = {
  render: 'CallToAction',
  transform(node, config) {
    const children = new NodeList(node.children);

    const body = children.beforeLastOfType('hr').transformFlat(config);
    const side = children.afterLastOfType('hr').transformFlat(config);

    const actions = extractActions(body);

    return new TagCtr(this.render, { side, actions }, body);
  }
}
