import Markdoc, { Config, Node, Schema, Tag } from '@markdoc/markdoc';
import { processBodyNodes } from '../common/page-section';

export function transformTrack(node: Node, fieldNames: string[], config: Config) {
  const name = node.children.find(c => c.type === 'heading');
  const data = node.children.find(c => c.type === 'inline');

  const tag = new Tag('li', { property: 'schema:track', typeof: 'schema:MusicRecording' });

  if (name) {
    const nameTag = Markdoc.transform(name, config) as Tag;
    nameTag.attributes.property = 'schema:name';

    tag.children.push(nameTag);
  }

  if (data) {
    const content = Markdoc.transform(data, config);
    const fields = content?.toString().split('|').map(f => f.trim()) || [];

    fields.forEach((f, i) => {
      tag.children.push(new Tag('span', { property: `schema:${fieldNames[i]}` }, [f]));
    });
  }

  return tag;
}

export class CommaSeparatedList {
  transform(value: string) {
    return value.split(',').map(v => v.trim());
  }
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
  },
  transform(node, config) {
    const trackList = node.children.find(c => c.type === 'list');
    const attr = node.transformAttributes(config);

    if (!trackList) {
      throw Error('No tracks');
    }

    const headerNodes = processBodyNodes(node.children.filter(c => c.type !== 'list'), 'schema');

    const tracks = new Tag('ol', {}, trackList.children.map(t => transformTrack(t, attr['track-fields'], config)));
    const header = new Tag('header', {}, headerNodes.map(n => Markdoc.transform(n, config)));

    return new Tag('section', { property: 'contentSection', typeof: 'schema:MusicPlaylist' }, [
      header,
      tracks
    ]);
  },
}
