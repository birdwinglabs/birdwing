import markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag } = markdoc;

export const feature: Schema = {
  render: 'Feature',
  transform(node, config) {
    const children = new NodeList(node.children);

    const { body, side, bottom } = children.commentSections(['body', 'side', 'bottom'], 'body');
    const attributes = {
      side: side.transformFlat(config),
      bottom: bottom.transformFlat(config),
      ...node.transformAttributes(config),
    }

    return new Tag(this.render, attributes, body.transformFlat(config));
  }
}
