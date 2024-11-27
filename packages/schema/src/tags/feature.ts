import markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

const { Tag } = markdoc;

export const feature: Schema = {
  render: 'Feature',
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
    const { body, showcase } = children.commentSections(['body', 'showcase', 'bottom'], 'body');
    const layout = createLayout('container', attr);

    layout.pushContent('body', body.transformFlat(config));
    layout.pushContent('showcase', showcase.transformFlat(config));

    return new Tag(this.render, { id: attr['id'], class: attr['class'] }, [layout.container]);
  }
}
