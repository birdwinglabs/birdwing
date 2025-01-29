import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

const { Tag: TagCtr } = Markdoc;

export const grid: Schema = {
  //render: 'Grid',
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
    try {
      const attr = node.transformAttributes(config);
      const layout = createLayout({ layout: 'grid', ...attr });

      new NodeList(node.children)
        .splitByHr()
        .map(s => s.body)
        .forEach(nodes => layout.pushContent(nodes.transformFlat(config), { name: 'item' }));

      return new Tag('section', { typeof: 'Grid' }, [layout.container]);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
}
