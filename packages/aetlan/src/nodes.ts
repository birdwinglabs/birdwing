import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export class Document {
  transform(node: any, config: any) {
    return new Tag(config.variables.context, node.attributes, node.transformChildren(config));
  }
}

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

export class Paragraph {
  transform(node: any, config: any) {
    return new Tag(`${config.variables.context}.paragraph`, node.attributes, node.transformChildren(config));
  }
}

export class Fence {
  readonly attributes = {
    content: {
      type: String
    },
    language: {
      type: String
    },
    process: {
      type: Boolean
    }
  };

  transform(node: any, config: any) {
    return new Tag(`${config.variables.context}.fence`, node.attributes, node.transformChildren(config));
  }
}

export class List {
  readonly attributes = {
    ordered: {
      type: Boolean
    }
  };

  transform(node: any, config: any) {
    return new Tag(`${config.variables.context}.list`, node.attributes, node.transformChildren(config));
  }
}

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
    return new Tag(`${config.variables.context}.link`, node.attributes, node.transformChildren(config));
  }
}
