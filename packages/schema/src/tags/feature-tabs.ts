import { Schema, Tag } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { TabFactory } from './tabs';

export const featureTabs: Schema = {
  transform(node, config) {
    const children = new NodeList(node.children);
    const attr = node.transformAttributes(config);
    const [ header, body ] = children.splitByHr();

    header.body.all().forEach((n, i) => {
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

    const fact = new TabFactory(config);
    const tabGroup = fact.createTabGroup(attr.id, 'tabs', body.body);

    return new Tag('section', { property: 'contentSection', typeof: 'FeatureTabs' }, [
      new Tag('header', {}, header.body.transformFlat(config)),
      tabGroup,
    ]);
  }
}
