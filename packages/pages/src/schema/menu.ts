import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export const menu: Schema = {
  render: 'Menu',
  children: ['heading', 'link', 'list'],
  transform(node, config) {
    const variables = { ...config.variables, context: 'Menu' };

    return new Tag('Menu', node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}
