import { Schema, Tag } from '@markdoc/markdoc';

export const footer: Schema = {
  children: ['heading', 'link', 'list', 'paragraph'],
  transform(node, config) {
    return new Tag('footer', { property: 'footer', typeof: 'Footer' }, node.transformChildren(config));
  },
}
