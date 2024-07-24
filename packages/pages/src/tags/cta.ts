import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export abstract class CustomTag {
  readonly render: string;

  transform(node: any, config: any) {
    const variables = { ...config.variables, context: this.render };

    return new Tag(this.render, node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}

export class Cta extends CustomTag {
  readonly render = 'Cta';

  transformChild(node: any, config: any) {
    return markdoc.transform(node, config);
  }

  transform(node: any, config: any) {
    const splitIndex = node.children.findIndex((child: any) => child.type === 'hr');
    const variables = { ...config.variables, context: this.render };

    let body = node.transformChildren({...config, variables });
    let side = undefined;
    let actions = undefined;

    if (splitIndex >= 0) {
      body = node.children.slice(0, splitIndex).map((node: any) => this.transformChild(node, {...config, variables }));
      side = node.children.slice(splitIndex + 1).map((node: any) => this.transformChild(node, {...config, variables }));
    }

    const actionsIndex = body.findIndex((c: any) => {
      return c.name === 'Cta.paragraph'&& c.children.findIndex((c: any) => c.name === 'Cta.link') >= 0;
    });

    if (actionsIndex >= 0) {
      const t = body[actionsIndex];

      actions = t.children.map((c: any, index: number) => {
        if (typeof c !== 'string' && c.name === 'Cta.link') {
          c.attributes['class'] = index === 0 ? 'primary' : 'secondary';
        }
        return c;
      });

      body.splice(actionsIndex);
    }

    return new Tag('Cta', { side, actions }, body);
  }
}
