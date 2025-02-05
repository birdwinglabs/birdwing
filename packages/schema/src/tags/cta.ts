import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

const { Tag } = Markdoc;

export const cta: Schema = {
  attributes: {
    split: {
      type: String,
      required: false,
    },
    mirror: {
      type: Boolean,
      required: false,
    }
  },
  transform(node, config) {
    const children = new NodeList(node.children);
    const attr = node.transformAttributes(config);

    const { head, body, actions, showcase, footer } = children
      .commentSections(['head', 'body', 'actions', 'showcase', 'footer'], 'body');

    body.all().forEach((n, i) => {
      if (i === 0 && n.type === 'paragraph') {
        n.attributes.property = 'name';
      } else if (n.type === 'heading') {
        n.attributes.property = 'headline';
      } else if (n.type === 'paragraph') {
        n.attributes.property = 'description';
      }
    });

    for (const node of actions.walk()) {
      if (node.type === 'item') {
        node.attributes.typeof = 'Action';
        node.attributes.property = 'action';
      }

      if (node.type === 'link') {
        for (const child of node.children) {
          if (child.type === 'text') {
            child.attributes.property = 'name';
          }
        }
        node.attributes.property = 'url';
      } else if (node.type === 'fence') {
      } 
    }
    //const layout = createLayout({...attr, name: 'layout' });
    const layout = createLayout({
      layout: attr.split ? attr.mirror ? '2-column-mirror' : '2-column' : 'stack',
      fractions: attr.split,
      name: 'layout' 
    });

    layout.pushContent([
      new Tag('header', {}, head.transformFlat(config)),
      new Tag('section', { 'data-name': 'body' }, body.transformFlat(config)),
      new Tag('section', { 'data-name': 'actions' }, actions.transformFlat(config)),
      new Tag('footer', {}, footer.transformFlat(config)),
    ], { name: 'main' });
    layout.pushContent(showcase.transformFlat(config), { name: 'showcase' });

    const classes: string[] = [];
    if (attr.split) {
      classes.push('split');
    }
    if (attr.mirror) {
      classes.push('mirror');
    }

    return new Tag('section', {
      property: 'contentSection',
      typeof: 'CallToAction',
      class: classes.length > 0 ? classes.join(' ') : undefined,
    }, [layout.container]);
  }
}
