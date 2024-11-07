import markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag } = markdoc;

export const feature: Schema = {
  render: 'Feature',
  transform(node, config) {
    const children = new NodeList(node.children);

    const { body, side } = children.commentSections(['body', 'side'], 'body');
    const attributes = {
      side: side.transformFlat(config),
      ...node.transformAttributes(config),
    }

    return new Tag(this.render, attributes, body.transformFlat(config));
  }
}
