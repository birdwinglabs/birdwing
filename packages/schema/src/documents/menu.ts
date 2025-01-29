import { Schema, Tag } from '@markdoc/markdoc';

export const menu: Schema = {
  children: ['heading', 'link', 'list'],
  transform(node, config) {
    return new Tag('nav', { property: 'menu', typeof: 'Menu' }, node.transformChildren(config));
  },
}
