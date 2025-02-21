import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util.js';
import { TabFactory } from './tabs.js';
import { createLayout } from '../layouts/index.js';

const { Tag } = Markdoc;


export const editor: Schema = {
  children: ['heading', 'fence', 'hr'],
  attributes: {
    'layout': {
      type: String,
      default: 'grid',
      required: false,
    },
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
    'tiles': {
      type: String,
      default: '1',
      required: false,
    }
  },
  transform(node, config) {
    generateIdIfMissing(node, config);

    const attr = node.transformAttributes(config);
    const fact = new TabFactory(config);
    const tabGroups = new NodeList(node.children)
      .splitByHr()
      .map(s => fact.createTabGroup(attr['id'], 'tabs', s.body));

    const layout = createLayout({...attr, items: attr.tiles });

    for (const tabGroup of tabGroups) {
      layout.pushContent([tabGroup], { name: 'area' });
    }

    return new Tag('section', { typeof: 'Editor' }, [layout.container]);
  }
}
