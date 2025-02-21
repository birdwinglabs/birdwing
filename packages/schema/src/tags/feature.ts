import Markdoc, { Schema, Tag, Ast } from '@markdoc/markdoc';
import { createFactory, tag } from '../util.js';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { SpaceSeparatedNumberList } from '../attributes.js';

export const definition: Schema = {
  render: 'div',
  transform(node, rootConfig) {
    return createFactory(schema.FeatureDefinition, {
      tag: 'div',
      groups: [
        {
          name: 'term',
          include: [{ node: 'paragraph', descendant: 'image' }, 'heading'],
          transforms: {
            paragraph: node => {
              const img = Array.from(node.walk()).find(n => n.type === 'image');
              return Markdoc.transform(img ? img : node, rootConfig);
            },
            heading: node => {
              const img = Array.from(node.walk()).find(n => n.type === 'image');
              const text = Array.from(node.walk()).filter(n => n.type === 'text');
              const span = new Tag('span', {}, Markdoc.transform(text, rootConfig));

              return img ? [ Markdoc.transform(img, rootConfig), span ] : span;
            }
          },
          output: nodes => new Tag('dt', {}, nodes),
        },
        {
          name: 'description',
          include: ['paragraph'],
          transforms: {
            paragraph: 'dd',
          }
        },
      ],
      properties: {
        image: tag({ group: 'term', match: 'svg' }),
        name: tag({ group: 'term', match: 'span' }),
        description: tag({ group: 'description', match: 'dd' }),
      },
    })
      .createTag(node, rootConfig);
  }
}

export const feature: Schema = {
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
  transform(node, config) {
    const attr = node.transformAttributes(config);
    const split = attr['split'] as number[];

    return createFactory(schema.Feature, {
      tag: 'section',
      property: 'contentSection',
      class: split.length > 0 ? 'split' : undefined,
      groups: [
        {
          name: 'header',
          section: 0,
          include: ['heading', 'paragraph'],
          output: nodes => new Tag('header', {}, nodes),
        },
        {
          name: 'definitions',
          section: 0,
          include: ['list'],
          transforms: {
            item: (node, config) => Markdoc.transform(
              new Ast.Node('tag', {}, node.children, 'definition'), config
            ),
            list: (node, config) => new Tag(
              'dl', split ? {} : { 'data-layout': 'grid', 'data-columns': 3 }, node.transformChildren(config)
            ),
          }
        },
        { name: 'showcase', section: 1 },
      ],
      properties: {
        headline: tag({ group: 'header', match: 'h1' }),
        description: tag({ group: 'header', match: 'p' }),
        featureItem: tag({ group: 'definitions', match: { tag: 'div', deep: true } })
      },
      refs: {
        definitions: tag({
          group: 'definitions',
          match: 'dl',
        })
      },
      project: p => splitLayout({
        split,
        mirror: attr.mirror,
        main: p.group('header', 'definitions'),
        side: p.group('showcase'),
      }),
    })
      .createTag(node, config)
  }
}
