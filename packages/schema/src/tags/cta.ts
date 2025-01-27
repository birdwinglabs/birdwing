import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

const { Tag } = Markdoc;

export const cta: Schema = {
  //render: 'CallToAction',
  attributes: {
    'layout': {
      type: String,
      default: 'stack',
      matches: [
        'stack',
        '2-column',
        '2-column-mirror'
      ],
      required: false,
    },
    'fractions': {
      type: String,
      default: '1 1',
      required: false,
    },
  },
  transform(node, config) {
    const children = new NodeList(node.children);
    const attr = node.transformAttributes(config);

    const { head, body, actions, showcase, footer } = children
      .commentSections(['head', 'body', 'actions', 'showcase', 'footer'], 'body');

    let actionIndex = 0;

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
        //console.log(node.children);
        //node.attributes.class = 'primary';
        node.attributes.property = 'url';
        //actionIndex++;
      } else if (node.type === 'fence') {
        ////node.attributes.property = 'action';
        //node.attributes.typeof = 'ActionCommand';
        //actionIndex++;
      } 
    }
    const layout = createLayout(attr);

    layout.pushContent([
      new Tag('section', { name: 'head' }, head.transformFlat(config)),
      new Tag('section', { name: 'body' }, body.transformFlat(config)),
      new Tag('section', { name: 'actions' }, actions.transformFlat(config)),
      new Tag('section', { name: 'footer' }, footer.transformFlat(config)),
    ], { name: 'main' });
    layout.pushContent(showcase.transformFlat(config), { name: 'showcase' });

    //layout.container.attributes.typeof = 'bw:CallToAction';
    //return layout.container;
    return new Tag('section', { property: 'contentSection', typeof: 'CallToAction' }, [layout.container]);
  }
}
