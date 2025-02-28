import Markdoc, { Node, RenderableTreeNodes } from '@markdoc/markdoc';
import { schema } from '@birdwing/renderable';
import { splitLayout } from '../layouts/index.js';
import { CommaSeparatedList, SpaceSeparatedNumberList } from '../attributes.js';
import { TypedNode } from '../interfaces.js';
import { attribute, group, Model, createComponentRenderable, createSchema } from '../lib/index.js';
import { NodeStream } from '../lib/node.js';
import { RenderableNodeCursor } from '../lib/renderable.js';
import { SplitablePageSectionModel } from './common.js';


class MusicRecordingModel extends Model {
  @attribute({ type: Boolean, required: false })
  listItem: boolean;

  @attribute({ type: String, required: false })
  byArtist: string;

  @attribute({ type: Number, required: false })
  copyrightYear: number;

  @attribute({ type: String, required: false })
  duration: string;

  @group({ include: ['heading'] })
  title: NodeStream;

  transform(): RenderableTreeNodes {
    const tagName = this.listItem ? 'li' : 'div';

    const children = this.title.transform();

    const name = children.tag('h1');
    const byArtist = RenderableNodeCursor.fromData(this.byArtist, 'span');
    const copyrightYear = RenderableNodeCursor.fromData(this.copyrightYear, 'span');
    const duration = RenderableNodeCursor.fromData(this.duration, 'span');

    return createComponentRenderable(schema.MusicRecording, {
      tag: tagName,
      properties: {
        name,
        byArtist,
        copyrightYear,
        duration,
      },
      children: children.concat(byArtist, copyrightYear, duration).toArray(),
    });
  }
}

export const musicRecording = createSchema(MusicRecordingModel);

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

class MusicPlaylistModel extends SplitablePageSectionModel {
  @attribute({ type: CommaSeparatedList, required: false })
  trackFields: string[];

  @attribute({ type: String, required: false })
  audio: string;

  @attribute({ type: SpaceSeparatedNumberList, required: false })
  split: number[];
  
  @attribute({ type: Boolean, required: false })
  mirror: boolean = false;

  @group({ section: 0, include: ['heading', 'paragraph'] })
  header: NodeStream;

  @group({ include: ['list'] })
  tracks: NodeStream;

  transform(): RenderableTreeNodes {
    const header = this.header
      .useNode('paragraph', node => {
        const img = Array.from(node.walk()).find(n => n.type === 'image');
        return Markdoc.transform(img ? img : node, this.config);
      })
      .transform();

    const tracks = this.tracks
      .useNode('item', (node, config) => {
        return MusicRecordingNode.fromItem(node, this.trackFields).transform(config)
      })
      .transform();

    const name = header.tag('p');
    const headline = header.tag('h1');
    const image = header.tag('img');
    const description = header.tag('p');
    const track = tracks.flatten().tag('div').typeof('MusicRecording');

    return createComponentRenderable(schema.MusicPlaylist, {
      tag: 'section',
      property: 'contentSection',
      properties: { name, headline, image, description, track },
      children: splitLayout({
        split: this.split,
        mirror: this.mirror,
        main: header.toArray(),
        side: tracks.toArray(),
      })
    });
  }
}

export const musicPlaylist = createSchema(MusicPlaylistModel);
