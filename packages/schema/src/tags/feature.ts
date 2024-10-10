import markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag } = markdoc;

export const feature: Schema = {
  render: 'Feature',
  transform(node, config) {
    const children = new NodeList(node.children);

    const { body, side } = children.commentSections(['body', 'side'], 'body');

    return new Tag(this.render, { side: side.transformFlat(config) }, body.transformFlat(config));
  }
}
