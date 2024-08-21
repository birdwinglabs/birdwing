import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export const cta: Schema = {
  transform(node, config) {
    const splitIndex = node.children.findIndex((child: any) => child.type === 'hr');
    const variables = { ...config.variables, context: 'Cta' };

    let body = node.transformChildren({...config, variables });
    let side = undefined;
    let actions = undefined;

    if (splitIndex >= 0) {
      body = node.children.slice(0, splitIndex).map((node: any) => Markdoc.transform(node, {...config, variables }));
      side = node.children.slice(splitIndex + 1).map((node: any) => Markdoc.transform(node, {...config, variables }));
    }

    const actionsIndex = body.findIndex((c: any) => {
      return c.name === 'Cta.paragraph'&& c.children.findIndex((c: any) => c.name === 'Cta.link') >= 0;
    });

    if (actionsIndex >= 0) {
      const t = body[actionsIndex];

      if (t instanceof Tag) {
        actions = t.children.map((c: any, index: number) => {
          if (typeof c !== 'string' && c.name === 'Cta.link') {
            c.attributes['class'] = index === 0 ? 'primary' : 'secondary';
          }
          return c;
        });

        body.splice(actionsIndex);
      }
    }

    return new Tag('Cta', { side, actions }, body);
  }
}
