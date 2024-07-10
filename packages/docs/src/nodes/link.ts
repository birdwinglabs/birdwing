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
    const { slug, slugMap, context } = config.variables || {};
    let attributes = node.attributes;

    if (slug && slugMap) {
      if (node.attributes.href in slugMap) {
        const href = slugMap[node.attributes.href];
        attributes = { href, selected: href === slug };
      }
    }
    return new Tag(`${context}.link`, attributes, node.transformChildren(config));
  }
}
