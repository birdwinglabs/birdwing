import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag: TagCtr } = Markdoc;

export const pricing: Schema = {
  render: 'Pricing',
  transform(node, config) {
    const children = new NodeList(node.children.filter(n => n.tag !== 'tier')).transformFlat(config);

    const tiers = new NodeList(node.children.filter(n => n.tag === 'tier'))
      .transformFlat(config);

    tiers.forEach((tier: Tag, index) => tier.attributes.index = index);

    return new TagCtr(this.render, { tiers, ...node.transformAttributes(config) }, children );
  },
}

export const tier: Schema = {
  render: 'Tier',
  attributes: {
    name: {
      type: String,
      required: true,
    },
    priceMonthly: {
      type: String,
      required: true,
    },
    featured: {
      type: Boolean,
      required: false,
      default: false,
    }
  }
}
