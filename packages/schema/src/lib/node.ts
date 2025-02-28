import Markdoc, { Ast, Config, Node, NodeType, RenderableTreeNodes, Schema } from "@markdoc/markdoc";
import * as renderable from '@birdwing/renderable';
import { RenderableNodeCursor } from "./renderable";
import { NodeFilter, NodeFilterOptions } from "../interfaces";

export const makeSchema = (tr: any) => {
  switch (typeof tr) {
    case 'string': return { render: tr };
    case 'object': return tr;
    default:
      return { transform(node, config) { return tr(node, config); }} as Schema;
  }
}

export class NodeStream {
  constructor(private nodes: Node[], public readonly config: Config) {}

  push(node: Node) {
    this.nodes.push(node);
  }

  get length(): number {
    return this.nodes.length;
  }

  wrapTag(tag: string, attributes: Record<string, any>) {
    return new NodeStream([new Ast.Node('tag', attributes, this.nodes, tag)], this.config);
  }

  useNode<T extends NodeType>(node: T, transform: Schema | renderable.NodeType | ((node: Node, config: Config) => RenderableTreeNodes)) {
    return new NodeStream(this.nodes, { ...this.config, nodes: { ...this.config.nodes, [node]: makeSchema(transform) }});
  }

  useTag<T extends string>(tag: T, transform: Schema | renderable.NodeType | ((node: Node, config: Config) => RenderableTreeNodes)) {
    return new NodeStream(this.nodes, { ...this.config, tags: { ...this.config.tags, [tag]: makeSchema(transform) }});
  }

  transform(): RenderableNodeCursor {
    return new RenderableNodeCursor(Markdoc.transform(this.nodes, this.config));
  }
}

export function isFilterMatching(n: Node, match: NodeFilter) {
  if (typeof match === 'function') {
    return match(n);
  }

  const filter: NodeFilterOptions = typeof match === 'string' ? { node: match } : match;
  if (filter.node && n.type !== filter.node) {
    return false;
  }
  if (filter.descendant && !Array.from(n.walk()).some(n => n.type === filter.descendant)) {
    return false;
  }
  return true;
}
