import Markdoc, { Schema, Node } from '@markdoc/markdoc';
import { generateIdIfMissing, NodeList } from '../util';

const { Tag } = Markdoc;

export const editor: Schema = {
  render: 'Editor',
  children: ['heading', 'fence'],
  transform(node, config) {
    generateIdIfMissing(node, config);

    const isIcon = (tag: any) => tag instanceof Tag && tag.name === 'svg' || tag.name === 'image';

    const { main, side, bottom } = new NodeList(node.children).commentSections(['main', 'side', 'bottom'], 'main');

    const makeTabs = (section: NodeList) => {
      const tabSections = section.headingSections();
      const tabs = tabSections.map(({ heading }) => {
        const tags = heading.transformChildren(config);

        return new Tag('EditorTab', { icon: tags.find(isIcon) }, tags.filter(t => !isIcon(t)));
      });
      const panels = tabSections.map(({ body }) => {
        return new Tag('EditorTabPanel', {}, body.transformFlat(config));
      });
      return { tabs, panels };
    }
    
    const attributes = {
      main: makeTabs(main),
      side: makeTabs(side),
      bottom: makeTabs(bottom),
      ...node.transformAttributes(config)
    };

    return new Tag(this.render, attributes);
  }
}
