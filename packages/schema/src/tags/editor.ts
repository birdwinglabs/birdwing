import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';
import { TabFactory } from './tabs';
import { createLayout } from '../layouts';

const { Tag } = Markdoc;


export const editor: Schema = {
  render: 'Editor',
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
      .map(s => fact.createTabGroup(s.body));

    const layout = createLayout('container', attr);

    for (const tabGroup of tabGroups) {
      layout.pushContent('area', [tabGroup]);
    }

    return new Tag(this.render, {}, [layout.container]);
  }
}
