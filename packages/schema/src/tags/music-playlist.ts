import Markdoc, { Node, RenderableTreeNode, Schema } from '@markdoc/markdoc';
import { schema } from '@birdwing/renderable';
import { createFactory, attribute, tag } from '../util.js';
import { splitLayout } from '../layouts/index.js';
import { CommaSeparatedList, SpaceSeparatedNumberList } from '../attributes.js';
import { TypedNode } from '../interfaces.js';

export const musicRecording: Schema<any, 'div' | 'li'> = {
  attributes: {
    listItem: { type: Boolean, required: false },
    byArtist: { type: String, required: false, render: true },
    copyrightYear: { type: String, required: false, render: true },
    duration: { type: String, required: false, render: true },
  },
  transform: (node, config) => {
    const tagName = node.attributes.listItem ? 'li' : 'div';

    return createFactory(schema.MusicRecording, {
      tag: tagName,
      groups: [
        { name: 'header', include: ['heading'] },
        { name: 'about' },
      ],
      properties: {
        name: tag({ match: 'h1', group: 'header', ns: 'schema' }),
        byArtist: tag({ match: 'span', ns: 'schema', group: 'byArtist' }),
        copyrightYear: tag({ match: 'span', ns: 'schema', group: 'copyrightYear' }),
        duration: tag({ match: 'meta', ns: 'schema', group: 'duration' })
      },
    })
    .createTag(node, config);
  }
}

class MusicRecordingNode<T extends 'div' | 'li'> extends TypedNode<'tag', T> {
  constructor(attributes: MusicRecordingAttributes = {}, children: Node[] = []) {
    super('tag', attributes, children, 'music-recording');
  }

  static fromItem(item: Node, fieldNames: string[]) {
    const inline = item.children.find(n => n.type === 'inline');
    const text = inline ? inline.children[0] : undefined;
    const attr: Record<string, any> = {
      listItem: true,
    };

    if (text) {
      const fields = (text.attributes.content as string).split('|').map(f => f.trim());
      fieldNames.forEach((key, index) => {
        attr[key] = fields[index];
      });
    }
    return new MusicRecordingNode<'li'>(attr, item.children.filter(c => c.type === 'heading'))
  }
}

interface MusicRecordingAttributes {
  listItem?: boolean;
  byArtist?: string;
  copyrightYear?: number;
  duration?: string;
}

export const musicPlaylist: Schema = {
  attributes: {
    'track-fields': {
      type: CommaSeparatedList,
      required: false,
    },
    audio: {
      type: String,
      required: false
    },
    split: {
      type: SpaceSeparatedNumberList,
      required: false
    },
    mirror: {
      type: Boolean,
      required: false,
    }
  },
  transform(node, rootConfig) {
    const attr = node.transformAttributes(rootConfig);
    const split = attr['split'] as number[];
    const mirror = attr['mirror'] as boolean;

    return createFactory(schema.MusicPlaylist, {
      tag: 'section',
      property: 'contentSection',
      groups: [
        {
          name: 'header',
          section: 0, 
          include: ['heading', 'paragraph'],
          transforms: {
            paragraph: node => {
              const img = Array.from(node.walk()).find(n => n.type === 'image');
              if (img) {
                return Markdoc.transform(img, rootConfig);
              }
              return Markdoc.transform(node, rootConfig);
            }
          }
        },
        {
          name: 'tracks',
          include: ['list'],
          transforms: {
            item: (node, config) => {
              return MusicRecordingNode.fromItem(node, attr['track-fields']).transform(config)
            },
          },
        },
      ],
      properties: {
        headline: tag({
          match: { tag: 'h1', limit: 1 },
          group: 'header',
          ns: 'schema'
        }),
        image: tag({
          group: 'header',
          match: 'img',
          ns: 'schema',
        }),
        description: tag({
          match: 'p',
          group: 'header',
          ns: 'schema'
        }),
        track: tag({
          match: { tag: 'li', deep: true },
          group: 'tracks',
          ns: 'schema'
        }),
      },
      project: p => splitLayout({ split, mirror, main: p.select({ section: 0 }), side: p.select({ section: 1 }) }),
    })
      .createTag(node, rootConfig);
  }
}
