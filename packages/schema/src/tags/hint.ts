import { Schema, Tag } from '@markdoc/markdoc';

export const hint: Schema = {
  attributes: {
    type: {
      type: String,
      default: 'note',
      matches: ['caution', 'check', 'note', 'warning'],
      errorLevel: 'critical'
    },
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);

    return new Tag('section', { property: 'contentSection', typeof: 'Hint' }, [
      new Tag('meta', { property: 'hintType', content: attr['type']}),
      new Tag('section', { 'data-name': 'body' }, node.transformChildren(config))
    ]);
  },
}
