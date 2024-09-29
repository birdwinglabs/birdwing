import markdoc, { Config, Node, Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag } = markdoc;

function transformList(node: Node, config: Config) {
  const childTags: any[] = [];

  for (const item of node.children) {
    const inline = item.children[0];
    const softbreakIndex = inline.children
      .findIndex(c => c.type === 'softbreak');

    const term = inline.children
      .slice(0, softbreakIndex)
      .map((c => markdoc.transform(c, config)));

    const data = inline.children
      .slice(softbreakIndex + 1)
      .map((c => markdoc.transform(c, config)));

    childTags.push(new Tag('dt', {}, term));
    childTags.push(new Tag('dd', {}, data));
  }

  return new Tag('dl', {}, childTags);
}

function transformChild(node: Node, config: Config) {
  if (node.type === 'list') {
    return transformList(node, config);
  }
  return markdoc.transform(node, config);
}

export const feature: Schema = {
  transform(node, config) {
    const children = new NodeList(node.children);

    const body = children.beforeLastOfType('hr').transformFlat(config);
    const side = children.afterLastOfType('hr').transformFlat(config);


    //const splitIndex = node.children.findIndex(child => child.type === 'hr');

    //if (splitIndex >= 0) {
      //const body = node.children
        //.slice(0, splitIndex)
        //.map(node => transformChild(node, config));

      //const side = node.children
        //.slice(splitIndex + 1)
        //.map(node => transformChild(node, config));

    return new Tag('Feature', { side }, body);
    //}
    //return new Tag('Feature', {}, node.transformChildren(config));
  }
}
