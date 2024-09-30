import { Node } from '@markdoc/markdoc';

export function allAncestorsOfType(node: Node, type: string) {
  const result: Node[] = [];
  for (const child of node.walk()) {
    if (child.type === type) {
      result.push(child);
    }
  }
  return result;
}
