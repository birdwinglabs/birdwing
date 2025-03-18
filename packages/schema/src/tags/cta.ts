import Markdoc, { Ast, RenderableTreeNodes, Tag } from '@markdoc/markdoc';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { attribute, group, Model } from '../lib/index.js';
import { NodeStream } from '../lib/node.js';
import { createComponentRenderable, createSchema } from '../lib/index.js';
import { SpaceSeparatedNumberList } from '../attributes.js';
import { linkItem, pageSectionProperties } from './common.js';
import { RenderableNodeCursor } from '../lib/renderable.js';
import { GridLayoutCursor } from '../layouts/split.js';

//class CommandModel extends Model {
  //transform(): RenderableTreeNodes {
    ////const output = new RenderableNodeCursor([Markdoc.transform(this.node)]);
    ////const output = this.transformChildren({
      ////code: node => {
        ////const tag = Markdoc.transform(
          ////new Ast.Node('fence', { language: 'shell', content: node.attributes.content }),
          ////this.config
        ////);
        ////if (Tag.isTag(tag)) {
          ////tag.attributes.content = node.attributes.content;
        ////}
        ////return tag;
      ////}
    ////});
    //const output = this.transformChildren();

    //return createComponentRenderable(schema.Command, {
      //tag: 'pre',
      //properties: {
        //code: output.flatten().tag('code'),
      //},
      //children: output.toArray(),
    //})
  //}
//}

//export const command = createSchema(CommandModel);

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
    const actions = this.actions
      .useNode('item', linkItem)
      .useNode('fence', node => {
        const output = new RenderableNodeCursor([Markdoc.transform(node, this.config)]);
        
        return createComponentRenderable(schema.Command, {
          tag: 'div',
          properties: {
            code: output.flatten().tag('code'),
          },
          children: output.next(),
        })
      })
      .transform();

    const side = this.showcase.transform();
    const className = this.split.length > 0 ? 'split' : undefined;

    const layout = splitLayout({
      split: this.split,
      mirror: this.mirror,
      main: nav.concat(header, actions).toArray(),
      side: side.toArray(),
    });

    return createComponentRenderable(schema.CallToAction, {
      tag: 'section',
      property: 'contentSection',
      class: [className, this.node.transformAttributes(this.config).class].join(' '),
      properties: {
        ...pageSectionProperties(header),
        action: actions.flatten().tags('li', 'div'),
      },
      refs: {
        showcase: layout.gridItem(1),
      },
      children: layout.next(),
    })
  }
}

export const cta = createSchema(CallToActionModel);
