import { Heading } from "./heading.js";
import { Link } from './link.js';
import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export class Document {
  transform(node: any, config: any) {
    if (config.variables.context === 'Documentation') {
      return new Tag(config.variables.context, {...node.attributes, ...config.variables.props, nav: config.variables.nav}, [
        ...node.transformChildren(config)
      ]);
    } else {
      return new Tag(config.variables.context, node.attributes, node.transformChildren(config));
    }
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

export function makeNodes() {
  return {
    document: new Document(),
    heading: new Heading(),
    link: new Link(),
    list: new List(),
    paragraph: new Paragraph(),
    fence: new Fence(),
  }
}
