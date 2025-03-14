import { RenderableTreeNodes } from '@markdoc/markdoc';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { attribute, group, Model } from '../lib/index.js';
import { NodeStream } from '../lib/node.js';
import { createComponentRenderable, createSchema } from '../lib/index.js';
import { SpaceSeparatedNumberList } from '../attributes.js';
import { linkItem, pageSectionProperties } from './common.js';

class CallToActionModel extends Model {
  @attribute({ type: SpaceSeparatedNumberList, required: false })
  split: number[] = [];
  
  @attribute({ type: Boolean, required: false })
  mirror: boolean = false;

  @group({ section: 0, include: ['list'] })
  nav: NodeStream;

  @group({ section: 0, include: ['heading', 'paragraph'] })
  header: NodeStream;

  @group({ section: 0, include: ['list', 'fence'] })
  actions: NodeStream;

  @group({ section: 1 })
  showcase: NodeStream;

  transform(): RenderableTreeNodes {
    const header = this.header.transform();
    const nav = this.nav.transform();
    const actions = this.actions.useNode('item', linkItem).transform();
    const side = this.showcase.transform();

    return createComponentRenderable(schema.CallToAction, {
      tag: 'section',
      property: 'contentSection',
      class: this.split.length > 0 ? 'split' : undefined,
      properties: {
        ...pageSectionProperties(header),
        action: actions.flatten().tag('li'),
      },
      children: splitLayout({
        split: this.split,
        mirror: this.mirror,
        main: nav.concat(header, actions).toArray(),
        side: side.toArray(),
      })
    })
  }
}

export const cta = createSchema(CallToActionModel);
