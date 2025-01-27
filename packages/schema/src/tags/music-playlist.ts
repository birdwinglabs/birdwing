import Markdoc, { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';

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

    const tracks = new Tag('list', { ordered: true }, trackList.children.map(t => {
      const name = t.children.find(c => c.type === 'heading');
      const data = t.children.find(c => c.type === 'inline');

      const tag = new Tag('item', { property: 'track', typeof: 'MusicRecording' });

      if (name) {
        const nameTag = Markdoc.transform(name, config) as Tag;
        nameTag.attributes.property = 'name';

        tag.children.push(nameTag);
      }

      if (data) {
        const content = Markdoc.transform(data, config);
        const fields = content?.toString().split('|').map(f => f.trim()) || [];

        fields.forEach((f, i) => {
          tag.children.push(new Tag('value', { property: trackFields[i] }, [f]));
        });
      }

      return tag;
    }));

    return new Tag('section', { typeof: 'MusicPlaylist' }, [
      tracks
    ]);
  },
}
