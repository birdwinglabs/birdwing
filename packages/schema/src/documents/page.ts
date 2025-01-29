import { Config, Tag, MaybePromise, Node, RenderableTreeNodes, Schema, RenderableTreeNode } from '@markdoc/markdoc';


export interface PageOptions {
  unwrap?: string[];
}

export class Page implements Schema {
  constructor(private options: PageOptions = {}) {}

  transform(node: Node, config: Config): MaybePromise<RenderableTreeNodes> {
    const options = { unwrap: [], ...this.options }

    const children = node.transformChildren(config);
    
    function* sections() {
      let section: RenderableTreeNode[] = [];

      for (const c of children) {
        if (c instanceof Tag && options.unwrap.includes(c.attributes.typeof)) {
          if (section.length > 0) {
            yield new Tag('section', { property: 'contentSection', typeof: 'PageContentSection' }, section);
            section = [];
          }
          yield c;
        } else {
          section.push(c);
        }
      }
      if (section.length > 0) {
        yield new Tag('section', { property: 'contentSection' }, section);
      }
    }
    return new Tag('main', { 'data-name': 'body' }, Array.from(sections()));
  }
}
