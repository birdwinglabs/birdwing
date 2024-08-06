import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export class Link {
  readonly attributes = {
    href: {
      type: String
    },
    title: {
      type: String
    }
  };

  transform(node: any, config: any) {
    const { urls, path, context } = config.variables || {};
    let attributes = node.attributes;
    const absPath = path + '/' + node.attributes.href;

    if (absPath in (urls || {})) {
      const href = urls[absPath];
      attributes = { ...attributes, href };
    }
    return new Tag(`${context}.link`, attributes, node.transformChildren(config));
  }
}
