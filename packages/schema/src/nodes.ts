import Markdoc, { Schema } from '@markdoc/markdoc';
import nodePath, { dirname } from 'path';

const { Tag, nodes } = Markdoc;

export const heading: Schema = {
  render: 'heading',
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

    return new Tag(this.render, attributes, children);
  }
}

export const paragraph: Schema = {
  ...nodes.paragraph,
  render: 'paragraph',
}

export const fence: Schema = {
  render: 'fence',
  attributes: nodes.fence.attributes,
  transform(node) {
    return new Tag(this.render, node.attributes, []);
  }
}

export const list: Schema = {
  render: 'list',
  children: ['item'],
  attributes: {
    ordered: { type: Boolean, required: true },
    start: { type: Number },
    marker: { type: String },
  },
}

export const item: Schema = {
  render: 'item',
  children: [
    'inline',
    'heading',
    'paragraph',
    'image',
    'table',
    'tag',
    'fence',
    'blockquote',
    'list',
    'hr',
  ],
};

export const em: Schema = {
  render: 'em',
  children: ['strong', 's', 'link', 'code', 'text', 'tag'],
  attributes: {
    marker: { type: String, render: true },
  },
};

export const strong: Schema = {
  render: 'strong',
  children: ['em', 's', 'link', 'code', 'text', 'tag'],
  attributes: {
    marker: { type: String, render: true },
  },
};

export const link: Schema = {
  render: 'link',
  transform(node, config) {
    const { urls, path } = config.variables || {};
    const dirName = dirname(path);
    let attributes = node.attributes;
    const absPath = dirName !== '/'
      ? nodePath.join(dirName, node.attributes.href)
      : node.attributes.href;

    if (absPath in (urls || {})) {
      const href = urls[absPath];
      attributes = { ...attributes, href };
    }
    return new Tag(this.render, attributes, node.transformChildren(config));
  }
}
