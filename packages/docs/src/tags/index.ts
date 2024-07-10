import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export abstract class Node {
  readonly render: string;

  transform(node: any , config: any) {
    const variables = { ...config.variables, context: this.render };

    return new Tag(this.render, node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}

export class Hint extends Node {
  readonly render = 'Hint';
  readonly attributes = {
    style: {
      type: String
    }
  };
}
