import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export abstract class CustomTag {
  readonly render: string;

  transform(node: any, config: any) {
    const variables = { ...config.variables, context: this.render };

    return new Tag(this.render, node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}

export class Feature extends CustomTag {
  readonly render = 'Feature';

  transformList(node: any, config: any) {
    const childTags: any[] = [];

    for (const item of node.children) {
      const inline = item.children[0];
      const softbreakIndex = inline.children.findIndex((c: any) => c.type === 'softbreak');
      const term = inline.children.slice(0, softbreakIndex).map(((c: any) => markdoc.transform(c, config)));
      const data = inline.children.slice(softbreakIndex + 1).map(((c: any) => markdoc.transform(c, config)));

      childTags.push(new Tag('Feature.dt', {}, term));
      childTags.push(new Tag('Feature.dd', {}, data));
    }

    return new Tag('Feature.dl', {}, childTags);
  }

  //transformListItem(node: any, config: any) {
    //const data = node.children
      //.filter((o: any) => o.type !== 'strong')
      //.map((n: any) => markdoc.transform(n, config));

      //return new Tag('Feature.dd', {}, c.transformChildren(config));
  //}

  transformChild(node: any, config: any) {
    if (node.type === 'list') {
      return this.transformList(node, config);
    }
    return markdoc.transform(node, config);
  }

  transform(node: any, config: any) {
    const splitIndex = node.children.findIndex((child: any) => child.type === 'hr');
    const variables = { ...config.variables, context: this.render };

    if (splitIndex >= 0) {
      const body = node.children.slice(0, splitIndex).map((node: any) => this.transformChild(node, {...config, variables }));
      const side = node.children.slice(splitIndex + 1).map((node: any) => this.transformChild(node, {...config, variables }));

      return new Tag('Feature', { side }, body);
    }
    return new Tag('Feature', {}, node.transformChildren({...config, variables }));
  }
}
