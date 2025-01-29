import pb from 'path-browserify';
import Markdoc, { Schema } from '@markdoc/markdoc';
import { TargetFile } from '@birdwing/core';
import * as xml from 'fast-xml-parser';

const { dirname, join, isAbsolute } = pb;
const { Tag, nodes } = Markdoc;

export const heading: Schema = {
  children: ['inline'],
  attributes: {
    level: { type: 'Number', required: true, render: false },
    property: { type: String, required: false },
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

    return new Tag(
      `h${node.attributes['level']}`,
      attributes,
      node.transformChildren(config)
    );
  }
}

export const paragraph: Schema = {
  children: ['inline'],
  attributes: {
    property: { type: String, required: false },
  },
  render: 'p',
}

export const fence: Schema = {
  render: 'fence',
  attributes: {
    content: {
      type: String,
      render: false,
    },
    process: { type: Boolean, render: false, default: false },
    language: { type: String, render: 'data-language', default: 'shell' },
    height: {
      type: String,
      default: 'full',
      matches: [
        'full',
        'xs',
        'sm',
        'md',
        'lg',
        'xl'
      ],
      required: false,
    },
    render: {
      type: String,
      matches: ['codeblock', 'html'],
      default: 'codeblock',
      required: false,
    }
  },
  transform(node, config) {
    const attributes = node.transformAttributes(config);
    const children = node.children.length
      ? node.transformChildren(config)
      : [node.attributes.content];

    return new Tag('pre', attributes, [node.attributes.content]);
    //const attr = node.transformAttributes(config);

    //if (attr.render === 'html' && ['html', 'svg'].includes(attr.language)) {
      //return new Tag('html', attr, [node.attributes.content]);
    //}
    //return new Tag(this.render, node.transformAttributes(config), [node.attributes.content]);
  }
}

export const list: Schema = {
  children: ['item'],
  attributes: {
    ordered: { type: Boolean, render: false, required: true },
    start: { type: Number },
    marker: { type: String, render: false },
  },
  transform(node, config) {
    node.children.forEach((item, index) => {
      item.attributes.index = index;
    });

    return new Tag(
      node.attributes.ordered ? 'ol' : 'ul',
      node.transformAttributes(config),
      node.transformChildren(config)
    );
  },
}

export const item: Schema = {
  render: 'li',
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
  attributes: {
    index: { type: Number, required: false },
    property: { type: String, required: false },
    typeof: { type: String, required: false },
  }
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

export const text: Schema = {
  attributes: {
    content: { type: String, required: true },
    property: { type: String, required: false },
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);

    if (attr.property) {
      return new Tag('span', { property: attr.property }, [node.attributes.content] );
    }
    return node.attributes.content;
  },
};

export const link: Schema = {
  render: 'a',
  transform(node, config) {
    const { urls, path } = config.variables || {};
    const dirName = dirname(path);
    let attributes = node.attributes;
    const absPath = dirName !== '/'
      ? join(dirName, node.attributes.href)
      : node.attributes.href;

    if (absPath in (urls || {})) {
      const href = urls[absPath];
      attributes = { ...attributes, href };
    }
    return new Tag(this.render, attributes, node.transformChildren(config));
  }
}

export const hardbreak = Markdoc.nodes.hardbreak;

export const image: Schema = {
  render: 'img',
  attributes: {
    src: { type: String, required: true },
    alt: { type: String },
    title: { type: String },
    property: { type: String },
    // width/height attributes will need to be to be implemented as an extension to markdown-it
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);
    const svgFiles: TargetFile[] = config.variables?.svg || [];

    let src = node.attributes.src;
    if (!isAbsolute(src)) {
      src = join('/', dirname(config.variables?.path), src);
    }

    const svg = svgFiles.find(file => file._id === src);

    if (svg) {
      const parser = new xml.XMLParser({ ignoreAttributes: false });
      let jObj = parser.parse(svg.content);
      const tag = jObjToTag('svg', jObj.svg);

      if (attr.property) {
        tag.attributes.property = attr.property;
        tag.attributes.xmlns = undefined;
      }

      return tag;
    }

    return new Tag(this.render, attr, node.transformChildren(config));
  },
};

function jObjToTag(tagName: string, content: Record<string, any>) {
  let children: any[] = [];
  let attr: Record<string, string | undefined> = {};

  for (const [k, v] of Object.entries(content)) {
    if (k.startsWith('@_')) {
      attr[k.slice(2)] = v;
    } else {
      children.push(jObjToTag(k, v));
    }
  }
  return new Tag(tagName, attr, children);
}
