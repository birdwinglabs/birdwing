import * as renderable from "@birdwing/renderable";
import { Ast, Config, Node, NodeType, Tag } from "@markdoc/markdoc";

export interface NodeFilterOptions {
  node?: NodeType;
  limit?: number;
  descendant?: string;
  deep?: boolean;
}

export type NodeFilterFunction = (node: Node) => boolean;

export type NodeFilter = NodeType | NodeFilterOptions | NodeFilterFunction;

export interface Group {
  section?: number,
  include?: NodeFilter[],
}

export class TypedNode<IN extends NodeType, OUT extends renderable.NodeType> extends Ast.Node {
  constructor(
    type: IN,
    attributes: Record<string, any>,
    children: Node[],
    tag?: string,
  ) {
    super(type, attributes, children, tag);
  }

  transform(config: Config): Tag<OUT> {
    return super.transform(config) as Tag<OUT>;
  }
}

export type TransformFunction<T extends renderable.NodeType> = (node: Node, config: Config) => Tag<T>;

