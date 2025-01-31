import Markdoc, { Schema, Tag, Node, RenderableTreeNode, Config } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

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
    'layout': {
      type: String,
      default: 'stack',
      matches: [
        'stack',
        '2-column',
        '2-column-mirror'
      ],
      required: false,
    },
    'fractions': {
      type: String,
      default: '1 1',
      required: false,
    },
  },
  transform(node, config) {
    const children = new NodeList(node.children);
    const { showcase, ...attr } = node.transformAttributes(config);
    const [ body, showcaseSection ] = children.splitByHr();
    const layout = createLayout({ ...attr, name: 'layout' });

    const bodyNodes = body.body.all();

    bodyNodes.forEach((n, i) => {
      if (i === 0 && n.type === 'paragraph') {
        n.attributes.property = 'name';
      } else if (i === 1 && n.type === 'heading') {
        n.attributes.property = 'headline';
      } else if (n.type === 'paragraph') {
        n.attributes.property = 'description';
      }
    });

    const bodyTags = bodyNodes.map(n => n.type === 'list' 
      ? definitionList(n, config, attr.layout === 'stack')
      : Markdoc.transform(n, config)
    );

    const dlIndex = bodyTags.findIndex(t => t instanceof Tag && t.name === 'dl');
    const header = new Tag('header', {}, bodyTags.slice(0, dlIndex));

    layout.pushContent([header, ...bodyTags.slice(dlIndex)], { name: 'body' });

    if (showcaseSection) {
      layout.pushContent(showcaseSection.body.transformFlat(config), { name: 'showcase' });
    }

    return new Tag('section', {
      property: 'contentSection',
      typeof: attr.layout === 'stack' ? 'Feature' : 'FeatureSplit'
    }, [layout.container]);
  }
}
