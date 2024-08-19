import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export abstract class CustomTag {
  readonly render: string;

  transform(node: any, config: any) {
    const variables = { ...config.variables, context: this.render };

    return new Tag(this.render, node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}
