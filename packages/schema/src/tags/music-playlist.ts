import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { processBodyNodes } from '../common/page-section';

export const musicPlaylist: Schema = {
  attributes: {
    'track-fields': {
      type: String,
      required: false
    },
    audio: {
      type: String,
      required: false
    }
  },
  transform(node, config) {
    const trackList = node.children.find(c => c.type === 'list');
    const attr = node.transformAttributes(config);

    const trackFields = (attr['track-fields'] as string).split(',').map(f => f.trim());

    if (!trackList) {
      throw Error('No tracks');
    }

    const headerNodes = processBodyNodes(node.children.filter(c => c.type !== 'list'), 'schema');

    const tracks = new Tag('ol', {}, trackList.children.map(t => {
      const name = t.children.find(c => c.type === 'heading');
      const data = t.children.find(c => c.type === 'inline');

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
          tag.children.push(new Tag('span', { property: `schema:${trackFields[i]}` }, [f]));
        });
      }

      return tag;
    }));

    return new Tag('section', { property: 'contentSection', typeof: 'schema:MusicPlaylist' }, [
      new Tag('header', {}, headerNodes.map(n => Markdoc.transform(n, config))),
      tracks
    ]);
  },
}
