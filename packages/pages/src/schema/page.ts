import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export const page: Schema = {
  children: undefined,
  transform(node, config) {
    const variables = { ...config.variables, context: 'Page' };

    return new Tag('Page', node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}
