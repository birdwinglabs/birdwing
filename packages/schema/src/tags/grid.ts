import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag: TagCtr } = Markdoc;

export const bentoGrid: Schema = {
  render: 'BentoGrid',
  attributes: {
    rows: {
      type: Number,
      required: true,
    },
    cols: {
      type: Number,
      required: true,
    },
    layout: {
      type: Object,
      required: true,
    }
  },
  transform(node, config) {
    const sections = new NodeList(node.children).commentSections();
    const layout = node.attributes.layout;

    const items = Object.entries(sections).map(([name, children]) => {
      return new Tag('GridItem', layout[name], children.transformFlat(config));
    });

    return new TagCtr(this.render, { items, ...node.transformAttributes(config) }, [] );
  },
}
