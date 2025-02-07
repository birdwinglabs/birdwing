import Markdoc, { Schema, Tag, Node, RenderableTreeNode, Config, ConfigFunction, MaybePromise, NodeType, RenderableTreeNodes } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';
import { processBodyNodes } from '../common/page-section';

//interface DefinitionListOptions {
  //columns?: number | ((itemCount: number) => number);

  //list?: Record<string, string | number | boolean>;

  //term?: Record<string, string | number | boolean>;

  //definition?: Record<string, string | number | boolean>;

  //item?: Record<string, string | number | boolean>;
//}

//class DefinitionList {
  //constructor(private options: DefinitionListOptions = {}) {}

  //transform(root: Node, config: Config): RenderableTreeNode {
    //const { columns, term, definition, item } = this.options;

    //const dlAttr: any = columns 
      //? { 'data-layout': 'grid', 'data-columns': typeof columns === 'number' ? columns : columns(root.children.length) }
      //: {};

    //return new Tag('dl', dlAttr, root.children.map(item => {
        //const children: RenderableTreeNode[] = [];

        //item.children.forEach((n, i) => {
          //if (i === 0 && n.type === 'heading') {
            //let tags = n.transformChildren(config);
            //if (tags.length > 1 && tags[1] instanceof Tag && tags[1].name === 'svg') {
              //tags = tags.reverse();
            //}
            //children.push(new Tag('dt', term, tags));
          //} else if (i === 1 && n.type === 'paragraph') {
            //children.push(new Tag('dd', definition, n.transformChildren(config)));
          //}
        //});

        //const attr: any = { property: 'featureItem', typeof: 'FeatureDefinition' };

        //return new Tag('div', attr, children);
      //})
    //)
  //}
//}

function definitionList(list: Node, config: Config, grid: boolean = false): RenderableTreeNode {
  const dlAttr: any = grid 
    ? { 'data-layout': 'grid', 'data-columns': 3 }
    : {};

  return new Tag('dl', dlAttr, list.children.map(item => {
      const children: RenderableTreeNode[] = [];

      item.children.forEach((n, i) => {
        if (i === 0 && n.type === 'heading') {
          let tags = n.transformChildren(config);
          if (tags.length > 1 && tags[1] instanceof Tag && tags[1].name === 'svg') {
            tags = tags.reverse();
          }
          children.push(new Tag('dt', { property: 'name' }, tags));
        } else if (i === 1 && n.type === 'paragraph') {
          children.push(new Tag('dd', { property: 'description' }, n.transformChildren(config)));
        }
      });

      const attr: any = { property: 'featureItem', typeof: 'FeatureDefinition' };

      return new Tag('div', attr, children);
    })
  )
}

export const feature: Schema = {
  attributes: {
    split: {
      type: String,
      required: false,
    },
    mirror: {
      type: Boolean,
      required: false,
    }
  },
  transform(node, config) {
    const children = new NodeList(node.children);
    const attr = node.transformAttributes(config);
    const [ body, showcaseSection ] = children.splitByHr();
    const layout = createLayout({
      layout: attr.split ? attr.mirror ? '2-column-mirror' : '2-column' : 'stack',
      fractions: attr.split,
      name: 'layout' 
    });

    const bodyNodes = processBodyNodes(body.body.all());

    const bodyTags = bodyNodes.map(n => n.type === 'list' 
      ? definitionList(n, config, attr.split === undefined)
      : Markdoc.transform(n, config)
    );

    const dlIndex = bodyTags.findIndex(t => t instanceof Tag && t.name === 'dl');
    const header = new Tag('header', {}, bodyTags.slice(0, dlIndex));

    layout.pushContent([header, ...bodyTags.slice(dlIndex)], { name: 'body' });

    if (showcaseSection) {
      layout.pushContent(showcaseSection.body.transformFlat(config), { name: 'showcase' });
    }

    const classes: string[] = [];
    if (attr.split) {
      classes.push('split');
    }
    if (attr.mirror) {
      classes.push('mirror');
    }

    return new Tag('section', {
      property: 'contentSection',
      typeof: 'Feature',
      class: classes.length > 0 ? classes.join(' ') : undefined,
    }, [layout.container]);
  }
}
