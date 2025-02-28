import { Ast, Config, Node, RenderableTreeNode, Tag } from '@markdoc/markdoc';

export function generateIdIfMissing(node: Node, config: Config) {
  if (!config.variables?.generatedIds) {
    (config.variables as Record<string, any>).generatedIds = new Set<string>();
  }
  const generatedIds = config.variables?.generatedIds as Set<string>;

  if (!node.attributes.id) {
    const prefix = node.type === 'tag' ? node.tag : node.type;

    if (node.type === 'tag') {
      let index = 0;

      while (generatedIds.has(`${prefix}-${index}`)) {
        index++;
      }
      const id = `${prefix}-${index}`;
      generatedIds.add(id);
      node.attributes.id = id;
    }
  }
}

export function *walkTag(tag: Tag): Generator<RenderableTreeNode> {
  for (const child of tag.children) {
    yield child;
    if (Tag.isTag(child)) {
      yield* walkTag(child);
    }
  }
}

export function headingsToList(level: number = 1) {
  return (nodes: Node[]) => {
    let start: number | undefined;
    const list = new Ast.Node('list');
    const head: Node[] = [];

    nodes.forEach((node, index) => {
      if (node.type === 'heading' && node.attributes.level === level) {
        list.children.push(new Ast.Node('item', {}, [node]));
        start = index;
      } else if (start === undefined) {
        head.push(node);
      } else {
        const lastItem = list.children.at(-1);
        if (lastItem) {
          lastItem.children.push(node);
        }
      }
    });

    return [...head, list];
  }
}
