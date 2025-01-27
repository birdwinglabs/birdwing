import { Schema, Tag } from '@markdoc/markdoc';

export const doc: Schema = {
  transform(node, config) {
    return new Tag('section', { name: 'body' }, node.transformChildren(config));
  },
}
