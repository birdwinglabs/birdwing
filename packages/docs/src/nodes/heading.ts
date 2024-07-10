import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export class Heading {
  readonly children = ['inline'];
  readonly attributes = {
    id: { type: String },
    level: { type: Number, required: true, default: 1 }
  }

  transform(node: any, config: any) {
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

    return new Tag(`${config.variables.context}.heading`, attributes, children);
  }
}
