import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';
import { TabFactory } from './tabs';

const { Tag } = Markdoc;

function parseGridTiles(layout: string) {
  return layout.split(' ').map(e => {
    const [c, r] = e.split(':');
    return {
      colspan: parseInt(c),
      rowspan: r ? parseInt(r) : undefined ,
    }
  })
}

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
    const sections = new NodeList(node.children).splitByHr();

    const tiles = parseGridTiles(attr['tiles']);
    const tabGroups = sections.map(s => fact.createTabGroup(s.body));

    const container = new Tag('grid', {
      name: 'container',
      columns: attr['columns'],
      rows: attr['rows'],
      flow: attr['flow']
    }, []);

    for (let i=0; i<tabGroups.length; i++) {
      container.children.push(new Tag('tile', tiles[i] || {}, [tabGroups[i]]));
    }

    return new Tag(this.render, {}, [container]);
  }
}
