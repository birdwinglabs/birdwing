import { Schema, Tag } from '@markdoc/markdoc';

export const doc: Schema = {
  transform(node, config) {
    return new Tag('main', { 'data-name': 'body' }, node.transformChildren(config));
  },
}
