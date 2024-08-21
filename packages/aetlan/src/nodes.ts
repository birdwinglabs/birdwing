import Markdoc, { Node, Schema, Config } from '@markdoc/markdoc';
import nodePath, { dirname } from 'path';

const { Tag, nodes } = Markdoc;

export const makeTransform = (name: string) => (node: Node, config: Config) =>
  new Tag(
    `${config.variables?.context}.${name}`,
    node.transformAttributes(config),
    node.transformChildren(config)
  );

export const document: Schema = {
  transform(node, config) {
    return new Tag(config.variables?.context, node.attributes, node.transformChildren(config));
  }
}

export const tagName = (name: string, config: Config) => `${config.variables?.context}.${name}`;


export const heading: Schema = {
  attributes: {
    level: {
      type: 'Number',
      required: true,
      render: true,
    }
  },
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const children = node.transformChildren(config);

    const generateID = () => {
      if (attributes.id && typeof attributes.id === 'string') {
        return attributes.id;
      }
      return children
        .filter((child: any) => typeof child === 'string')
        .join(' ')
        .replace(/[?]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
    }

    attributes.id = generateID();

    return new Tag(tagName('heading', config), attributes, children);
  }
}

export const paragraph: Schema = {
  ...nodes.paragraph,
  transform: makeTransform('paragraph'),
}

export const fence: Schema = {
  attributes: nodes.fence.attributes,
  transform(node, config) {
    return new Tag(tagName('fence', config), node.attributes, node.transformChildren(config));
  }
}

export const list: Schema = {
  ...nodes.list,
  transform: makeTransform('list'),
}

export const link: Schema = {
  ...nodes.list,
  transform(node, config) {
    const { urls, path, context } = config.variables || {};
    const dirName = dirname(path);
    let attributes = node.attributes;
    const absPath = dirName !== '/'
      ? nodePath.join(dirName, node.attributes.href)
      : node.attributes.href;

    if (absPath in (urls || {})) {
      const href = urls[absPath];
      attributes = { ...attributes, href };
    }
    return new Tag(`${context}.link`, attributes, node.transformChildren(config));
  }
}
