import { ComponentType } from "@birdwing/renderable";
import * as renderable from "@birdwing/renderable";
import { Ast, Config, Node, NodeType, RenderableTreeNode, RenderableTreeNodes, Tag } from "@markdoc/markdoc";

export interface ContentOptions {
  name?: string;

  property?: string;

  typeof?: string;
}

export interface Match {
  node: Node;
  group: number;
}

export interface NodeFilterOptions {
  //section?: number;
  node?: NodeType;
  limit?: number;
  descendant?: string;
  deep?: boolean;
  //parent?: string;
}

//export interface NodeFilterFunctionArgs {
  //node: Node;
  //section: number;
//}

export type NodeFilterFunction = (node: Node) => boolean;

export type NodeFilter = NodeType | NodeFilterOptions | NodeFilterFunction;

export interface TransformOptions {
  match: (match: Match) => boolean;
  input?: (node: Node) => Node | undefined;
  transform?: (node: Node, config: Config) => RenderableTreeNode;
  output?: (renderable: RenderableTreeNode) => RenderableTreeNodes;
  property?: string;
}

export interface Group {
  name: string,
  section?: number,
  include?: NodeFilter[],
  transforms?: Partial<Record<NodeType, renderable.NodeType | ((node: Node, config: Config) => RenderableTreeNodes)>>;
  output?: (nodes: RenderableTreeNode[]) => RenderableTreeNodes;
  clone?: string;
  facets?: Group[];
}

export interface PipeOptions {
  match?: NodeType | NodeFilterOptions;
  group?: string;
  input?: (node: Node) => Node | undefined;
  transform?: (node: Node, config: Config) => RenderableTreeNodes;
  output?: (renderable: RenderableTreeNodes) => RenderableTreeNodes;
  property?: string;
  split?: Omit<PipeOptions, 'match' | 'group' | 'split'>[];
}

export interface TagFilter<T> {
  tag: T,
  attributes?: Record<string, any>;
  deep?: boolean;
  limit?: number;
}

//export class TransformationNode<IN extends NodeType, OUT extends renderable.NodeType> extends Ast.Node {
  //constructor(
    //type: IN,
    //attributes: Record<string, any>,
    //children: Node[],
    //private transformation: (node: Node, config: Config) => Tag<OUT>
  //) {
    //super(type, attributes, children);
  //}

  //transform(config: Config): Tag<OUT> {
    //return this.transformation(this, config);
  //}
//}

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

export interface NodeContext {
  section: number | undefined;

  node: Node;

  parent: Node;
}

export type TransformFunction<T extends renderable.NodeType> = (node: Node, config: Config) => Tag<T>;

export abstract class PropertyTransform<T> {
  abstract readonly group: string | undefined;

  preProcess(property: string, nodes: NodeContext[]) {}

  postProcess(property: string, result: TransformResult[], attr: Record<string, any>) {}
}


export interface PropertyFactory {
  group?: string;
  ns?: string;
}

export interface PropertyAnnotation<T extends renderable.NodeType> extends PropertyFactory {
  match: TagFilter<T> | T;
}

export interface PropertyTransformation<T extends renderable.NodeType> extends PropertyFactory {
  match: NodeFilter;

  replace?: (node: Node) => TypedNode<any, T>;

  transform?: T | TransformFunction<T>;
}

export interface PropertyAttributeOptions<T extends renderable.NodeType> extends PropertyFactory {
  tag: T;
}

export interface FactoryOptions<TSchema, T extends ComponentType<TSchema>> {
  tag: T['tag'];
  property?: string;
  class?: string;
  nodes?: ((nodes: Node[]) => Node[])[];
  transforms?: Partial<Record<NodeType, renderable.NodeType | ((node: Node, config: Config) => RenderableTreeNodes)>>;
  project?: (projection: Projection) => RenderableTreeNodes;
  groups?: Group[];
  properties?: Partial<{ [P in keyof T["properties"]]: PropertyTransform<T["properties"][P]> }>;
  refs?: Partial<{ [P in keyof T["refs"]]: PropertyTransform<T["refs"][P]> }>;
}

export interface TransformResult {
  group: string[];
  section: number;
  output: RenderableTreeNodes;
}

export interface ResultFilter {
  group?: string; 
  section?: number;
}

export class Projection {
  constructor(private result: TransformResult[]) {}

  select({ group, section }: ResultFilter): RenderableTreeNode[] {
    return this.result
      .filter(r => (group !== undefined && r.group.includes(group)) && section !== undefined ? r.section === section : true)
      .map(r => r.output)
      .flat();
  }

  group(...groups: string[]) {
    return this.result
      .filter(r => r.group.some(g => groups.includes(g)))
      .map(r => r.output)
      .flat();
  }

  eachSection(fn: (nodes: RenderableTreeNode[], section: number) => void) {
    Array.from(new Set(this.result.map(r => r.section)))
      .sort()
      .forEach(section => fn(this.select({ section }), section));
  }
}
