import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';
import { TabFactory } from './tabs';

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
    'showcase': {
      type: String,
      default: 'auto',
      matches: ['auto', 'tabs'],
      required: false,
    }
  },
  transform(node, config) {
    const children = new NodeList(node.children);
    const { showcase, ...attr } = node.transformAttributes(config);
    const [ body, showcaseSection ] = children.splitByHr();
    const layout = createLayout({ property: 'contentSection', typeof: 'Feature', ...attr });

    const bodyNodes = body.body.all();

    bodyNodes.forEach((n, i) => {
      if (i === 0 && n.type === 'heading') {
        n.attributes.property = 'name';
      }
      if (i === 1 && n.type === 'heading') {
        n.attributes.property = 'headline';
      }
      if (n.type === 'paragraph') {
        n.attributes.property = 'description';
      }
    });

    layout.pushContent(bodyNodes.map(n => Markdoc.transform(n, config)), { name: 'body' });

    if (showcaseSection) {
      switch (showcase) {
        case 'auto':
          layout.pushContent(showcaseSection.body.transformFlat(config), { name: 'showcase' });
          break;
        case 'tabs':
          const fact = new TabFactory(config);
          const tabGroup = fact.createTabGroup(attr.id, 'tabs', showcaseSection.body);
          layout.pushContent(tabGroup.children, { ...tabGroup.attributes, name: 'showcase' });
          break;
      }
    }

    return layout.container;
  }
}
