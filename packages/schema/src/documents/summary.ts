import { Schema, Tag } from '@markdoc/markdoc';

export const summary: Schema = {
  transform(node, config) {
    return new Tag('nav', { property: 'summary', typeof: 'TableOfContents' }, node.transformChildren(config));
  },
}
