import markdoc, { Config, Node, Schema } from '@markdoc/markdoc';

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

    childTags.push(new Tag('Feature.dt', {}, term));
    childTags.push(new Tag('Feature.dd', {}, data));
  }

  return new Tag('Feature.dl', {}, childTags);
}

function transformChild(node: Node, config: Config) {
  if (node.type === 'list') {
    return transformList(node, config);
  }
  return markdoc.transform(node, config);
}

export const feature: Schema = {
  transform(node, config) {
    const splitIndex = node.children.findIndex(child => child.type === 'hr');
    const variables = { ...config.variables, context: 'Feature' };

    if (splitIndex >= 0) {
      const body = node.children
        .slice(0, splitIndex)
        .map(node => transformChild(node, {...config, variables }));

      const side = node.children
        .slice(splitIndex + 1)
        .map(node => transformChild(node, {...config, variables }));

      return new Tag('Feature', { side }, body);
    }
    return new Tag('Feature', {}, node.transformChildren({...config, variables }));
  }
}
