import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

function generateID(children: any[], attributes: any) {
  if (attributes.id && typeof attributes.id === 'string') {
    return attributes.id;
  }
  return children
    .filter((child) => typeof child === 'string')
    .join(' ')
    .replace(/[?]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function makeHeading(customTags: string[], summary: boolean) {
  return {
    children: ['inline'],
    attributes: {
      id: { type: String },
      level: { type: Number, required: true, default: 1 }
    },
    transform(node: any, config: any) {
      const attributes = node.transformAttributes(config);
      const children = node.transformChildren(config);

      if (summary) {
        return new Tag(
          customTags.includes('SummaryHeading') ? 'SummaryHeading' : `h${node.attributes['level']}`,
          attributes,
          children
        );
      } else {
        const id = generateID(children, attributes);

        return new Tag(
          customTags.includes('Heading') ? 'Heading' : `h${node.attributes['level']}`,
          { ...attributes, id },
          children
        );
      }
    }
  };
}
