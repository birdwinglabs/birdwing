import { Schema, Tag } from '@markdoc/markdoc';
import { schema } from '@birdwing/renderable';
import { createFactory } from '../util.js';
import { createLayout } from '../layouts/index.js';

export const grid: Schema = {
  attributes: {
    'columns': {
      type: Number,
      default: undefined,
      required: false,
    },
    'rows': {
      type: Number,
      default: undefined,
      required: false,
    },
    'flow': {
      type: String,
      default: undefined,
      required: false,
      matches: ['row', 'column', 'dense', 'row dense', 'column dense'],
    },
    'items': {
      type: String,
      default: '1',
      required: false,
    }
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);

    const fact = createFactory(schema.Grid, {
      tag: 'section',
      groups: [
        { name: 'tiles' },
      ],
      project: p => {
        const layout = createLayout({ layout: 'grid', ...attr });
        p.eachSection(nodes => layout.pushContent(nodes, { name: 'item' }));
        return new Tag('section', { typeof: 'Grid' }, [layout.container]);
      }
    });

    return fact.createTag(node, config);
  },
}
