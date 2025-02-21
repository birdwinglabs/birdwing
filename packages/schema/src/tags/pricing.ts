import { Schema, Tag } from '@markdoc/markdoc';
import { attribute, createFactory, tag } from '../util.js';
import { schema } from '@birdwing/renderable';

export const pricing: Schema = {
  transform(node, config) {

    const fact = createFactory(schema.Pricing, {
      tag: 'section',
      property: 'contentSection',
      groups: [
        {
          name: 'header',
          include: ['heading', 'paragraph'],
          output: nodes => new Tag('header', {}, nodes),
        },
        {
          name: 'tiers',
          include: ['tag'],
          output: nodes => new Tag('ul', { 'data-layout': 'grid', 'data-columns': nodes.length }, nodes)
        },
      ],
      properties: {
        headline: tag({ group: 'header', match: 'h1' }),
        description: tag({ group: 'header', match: 'p' }),
        tier: tag({ group: 'tiers', match: 'li' }),
      },
    });

    return fact.createTag(node, config);
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

    //createFactory(featured ? schema.FeaturedTier : schema.Tier, {
      //tag: 'li',
      //groups: [
        //{ name: 'header' },
        //{ name: 'description', include: ['list', 'paragraph'] },
      //],
      //properties: {
        //name: attribute({ tag: 'h3', group: 'header' }),
        //price: attribute({ tag: 'p', group: 'header' }),
      //}
    //})

    return new Tag('li', { property: 'tier', typeof: featured ? 'FeaturedTier' : 'Tier' }, [
      new Tag('h3', { property: 'name' }, [name]),
      new Tag('p', { property: 'price', typeof: 'BillingMonthly' }, [priceMonthly]),
      ...node.transformChildren(config)
    ]);
  },
}
