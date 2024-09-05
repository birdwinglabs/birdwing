import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export const cta: Schema = {
  render: 'CallToAction',
  transform(node, config) {
    const splitIndex = node.children.findIndex(child => child.type === 'hr');

    let body = node.transformChildren(config);
    let side = undefined;
    let actions = undefined;

    if (splitIndex >= 0) {
      body = node.children
        .slice(0, splitIndex)
        .map(node => Markdoc.transform(node, config))
        .flat()

      side = node.children
        .slice(splitIndex + 1)
        .map(node => Markdoc.transform(node, config))
        .flat();
    }

    const actionsIndex = body.findIndex((c: any) => {
      return c.name === 'paragraph' && c.children.findIndex((c: any) => c.name === 'link') >= 0;
    });

    if (actionsIndex >= 0) {
      const t = body[actionsIndex];

      if (t instanceof Tag) {
        actions = t.children.map((c: any, index: number) => {
          if (typeof c !== 'string' && c.name === 'link') {
            c.attributes['class'] = index === 0 ? 'primary' : 'secondary';
          }
          return c;
        });

        body.splice(actionsIndex);
      }
    }

    return new Tag(this.render, { side, actions }, body);
  }
}
