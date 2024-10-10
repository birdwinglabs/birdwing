import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag: TagCtr } = Markdoc;

export const cta: Schema = {
  render: 'CallToAction',
  transform(node, config) {
    const children = new NodeList(node.children);

    const { head, body, actions, side, footer } = children.commentSections(['head', 'body', 'actions', 'side', 'footer'], 'body');

    for (const node of actions.walk()) {
      if (node.type === 'link') {
        node.attributes.class = 'primary';
        break;
      }
    }

    const attributes = {
      head: head.transformFlat(config),
      body: body.transformFlat(config),
      actions: actions.transformFlat(config),
      side: side.transformFlat(config),
      footer: footer.transformFlat(config),
    }

    return new TagCtr(this.render, attributes, []);
  }
}
