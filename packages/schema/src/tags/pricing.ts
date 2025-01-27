import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';

//const { Tag: TagCtr } = Markdoc;

export const pricing: Schema = {
  transform(node, config) {
    //const children = new NodeList(node.children.filter(n => n.tag !== 'tier')).transformFlat(config);
    const bodyNodes = node.children.filter(n => n.tag !== 'tier');

    bodyNodes.forEach((n, i) => {
      if (i === 0 && n.type === 'heading') {
        n.attributes.property = 'name';
      }
      if (i === 1 && n.type === 'heading') {
        n.attributes.property = 'headline';
      }
      if (n.type === 'paragraph') {
        n.attributes.property = 'description';
      }
    });

    const tiers = new NodeList(node.children.filter(n => n.tag === 'tier'))
      .transformFlat(config);

    return new Tag('section', { property: 'contentSection', typeof: 'Pricing' }, [
      new Tag('section', { name: 'description' }, bodyNodes.map(n => Markdoc.transform(n, config))),
      new Tag('grid', { name: 'tiers', columns: tiers.length }, tiers),
    ] );
  },
}

export const tier: Schema = {
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
  },
  transform(node, config) {
    const { name, priceMonthly, featured } = node.transformAttributes(config);

    return new Tag('tile', { property: 'tier', typeof: featured ? 'FeaturedTier' : 'Tier' }, [
      new Tag('heading', { level: 3, property: 'name' }, [name]),
      new Tag('paragraph', { property: 'price', typeof: 'BillingMonthly' }, [priceMonthly]),
      ...node.transformChildren(config)
    ]);
  },
}
