import Markdoc, { Schema } from '@markdoc/markdoc';
import { createFactory, tag } from '../util.js';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { SpaceSeparatedNumberList } from '../attributes.js';

const { Tag } = Markdoc;


const linkItemFactory = createFactory(schema.LinkItem, {
  tag: 'li',
  transforms: {
    text: node => new Tag('span', {}, [node.attributes.content]),
  },
  properties: {
    name: tag({ match: { tag: 'span', deep: true } }),
    url: tag({ match: 'a' }),
  }
});

export const cta: Schema = {
  attributes: {
    split: {
      type: SpaceSeparatedNumberList,
      required: false,
    },
    mirror: {
      type: Boolean,
      required: false,
    }
  },
  transform(node, rootConfig) {
    const attr = node.transformAttributes(rootConfig);
    const split = attr['split'] as number[];

    return createFactory(schema.CallToAction, {
      tag: 'section',
      property: 'contentSection',
      class: split.length > 0 ? 'split' : undefined,
      groups: [
        {
          name: 'nav',
          section: 0,
          include: ['list'],
          output: nodes => nodes.length > 0 ? new Tag('nav', {}, nodes) : [],
        },
        {
          name: 'header',
          section: 0,
          include: ['heading', 'paragraph'],
          output: nodes => new Tag('header', {}, nodes),
        },
        {
          name: 'actions',
          section: 0,
          include: ['list', 'fence'],
          transforms: {
            item: node => linkItemFactory.createTag(node, rootConfig),
          },
        },
        { name: 'showcase', section: 1 },
      ],
      properties: {
        headline: tag({ match: 'h1', group: 'header' }),
        description: tag({ group: 'header', match: 'p' }),
        action: tag({ group: 'actions', match: { tag: 'li', deep: true } })
      },
      project: p => splitLayout({
        split,
        mirror: attr.mirror,
        main: p.group('nav', 'header', 'actions'),
        side: p.group('showcase'),
      }),
    })
      .createTag(node, rootConfig)
  }
}
