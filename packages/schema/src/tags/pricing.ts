import { RenderableTreeNodes, Tag } from '@markdoc/markdoc';
import { schema } from '@birdwing/renderable';
import { NodeStream } from '../lib/node.js';
import { attribute, group, Model, createComponentRenderable, createSchema } from '../lib/index.js';
import { description, name } from './common.js';

class PricingModel extends Model {
  @group({ include: ['heading', 'paragraph' ] })
  header: NodeStream;

  @group({ include: ['tag'] })
  tiers: NodeStream;

  transform(): RenderableTreeNodes {
    const header = this.header.transform();
    const tiers = this.tiers.transform();

    return createComponentRenderable(schema.Pricing, {
      tag: 'section',
      property: 'contentSection',
      properties: {
        name: name(header),
        description: description(header),
        tier: tiers.tag('li'),
      },
      children: [
        header.wrap('header').next(),
        tiers.wrap('ul', { 'data-layout': 'grid', 'data-columns': tiers.nodes.length }).next(),
      ]
    });
  }
}

export const pricing = createSchema(PricingModel);

export class TierModel extends Model {
  @attribute({ type: String, required: true })
  name: string;

  @attribute({ type: String, required: true })
  priceMonthly: string;

  @attribute({ type: Boolean, required: false })
  featured: boolean = false;

  transform(): RenderableTreeNodes {
    const type = this.featured ? schema.FeaturedTier : schema.Tier;

    const name = new Tag('h1', {}, [this.name]);
    const priceMonthly = new Tag('p', {}, [this.priceMonthly]);
    const children = this.transformChildren();

    return createComponentRenderable(type, {
      tag: 'li',
      properties: {
        name,
        description: description(children),
        price: priceMonthly,
        url: children.flatten().tag('a'),
      },
      children: [name, priceMonthly, ...children.nodes],
    })
  }
}

export const tier = createSchema(TierModel);
