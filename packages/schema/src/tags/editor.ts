import Markdoc, { Schema } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';
import { TabFactory } from './tabs';

const { Tag } = Markdoc;

export const editor: Schema = {
  render: 'Editor',
  children: ['heading', 'fence'],
  transform(node, config) {
    generateIdIfMissing(node, config);

    const fact = new TabFactory('EditorTab', 'EditorTabPanel', config);
    const { main, side, bottom } = new NodeList(node.children)
      .commentSections(['main', 'side', 'bottom'], 'main');
    
    const attributes = {
      main: fact.createTabs(main),
      side: fact.createTabs(side),
      bottom: fact.createTabs(bottom),
      ...node.transformAttributes(config)
    };

    return new Tag(this.render, attributes);
  }
}
