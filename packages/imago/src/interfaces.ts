import { Template } from "@birdwing/react";
import React, { createContext, ReactNode } from "react";
import { defaultElements } from "./Elements";

export interface NodeProps extends Record<string, any>{
  id?: string;
  className?: string | any;
  children?: React.ReactNode;
  name?: string;
  typeof?: string;
  property?: string;
  index: number;
  isLast: boolean;
}

export interface MetaProps extends NodeProps {
  content: string;
}

export interface GridProps extends NodeProps {
  name?: string;

  columns?: number;

  rows?: number;

  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
}

export interface TileProps extends NodeProps {
  name?: string;

  colspan?: number;

  rowspan?: number;

  order?: number;
}

export interface LinkProps extends NodeProps {
  href: string;
}

//export interface ListProps extends NodeProps {
  //ordered: boolean;
//}

export interface ItemProps extends NodeProps {}

export interface ValueProps extends NodeProps {
  content: string;
}

export interface FenceProps extends NodeProps {
  children: string;
  'data-language': string;
  html?: boolean;
  height?: string;
}

export type ImagoHandler<T = any> = React.FunctionComponent<T>;
export type ImagoMiddleware<T = any> = (next: ImagoHandler<T> | (() => React.ReactElement | null), final: ImagoHandler<T>) => ImagoHandler<T>;
export type Middleware<T = any> = (props: T, next: ImagoHandler<T>) => React.FunctionComponent<T>;

export interface MiddlewareComponent {
  apply(): void;
}

export type NodeType = 
  'document' |

  // Document metadata
  'meta' |

  //Content sectioning
  'address' |
  'article' |
  'aside' |
  'footer' |
  'header' |
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' |
  'hgroup' |
  'main' |
  'nav' |
  'section' |
  'search' |

  // Text content
  'blockquote' |
  'dd' |
  'div' |
  'dl' |
  'dt' |
  'figcaption' |
  'figure' |
  'hr' |
  'li' |
  'menu' |
  'ol' |
  'p' |
  'pre' |
  'ul' |

  // Inline text semantics
  'a' |
  'abbr' |
  'b' |
  'bdi' |
  'bdo' |
  'br' |
  'cite' |
  'code' |
  'data' |
  'dfn' |
  'em' |
  'i' |
  'kbd' |
  'span' |
  'strong' |
  'time' |

  // Image and multimedia
  'area' |
  'audio' |
  'img' |
  'map' |
  'track' |
  'video' |

  // SVG and MathML
  'svg' |
  'path' |
  'math';

export type HandlerProps<T extends NodeProps> = T & { Slot: any };

export type TagProps<T extends NodeType> = 
  T extends 'pre' ? FenceProps :
  T extends 'li' ? ItemProps :
  T extends 'a' ? LinkProps :
  T extends 'meta' ? ValueProps :
  NodeProps;

export abstract class AbstractSelector<T extends NodeType> {
  constructor(public readonly types: NodeType[]) {}

  abstract match(props: TagProps<T>): boolean;
}

export interface TemplateOptions {
  refs?: Template[],
  elements?: Record<string, ImagoHandler>;
  selector?: AbstractSelector<any>;
}

export type Matcher<T extends NodeProps> = (props: T) => boolean;


export type NodeMap = Record<string, NodeType>;
export type PropertyMap = Record<string, Property<NodeType, any>>;

export interface Property<TNode extends NodeType, T> {
  tag: TNode;

  type: T;
}

export type PropertyTag<T extends Property<NodeType, T>> = T["tag"] ;
export type PropertyType<T extends Property<NodeType, T>> = T["type"] ;

export type PropertyNodes<T extends PropertyMap> = { [P in keyof T]: PropertyTag<T[P]> };
export type PropertyTypes<T extends PropertyMap> = { [P in keyof T]: PropertyType<T[P]> };

export abstract class AbstractTemplate {
  abstract resolve(node: string): React.FunctionComponent<any>;
}

export abstract class AbstractTemplateFactory {
  abstract template(): AbstractTemplate;

  use<T extends NodeType>(type: T, middleware: ImagoMiddleware<TagProps<T>>): AbstractTemplateFactory {
    return this;
  }

  applyMiddleware(fact: AbstractTemplateFactory) {
  }
}

export abstract class ComponentFactory<T extends NodeType> extends AbstractTemplateFactory {
  tag: T;

  type: string;
}

export interface ComponentType<TSchema> {
  tag: NodeType;

  schema: TSchema;

  properties: {[P in keyof TSchema]: NodeType};

  refs: Record<string, NodeType>
}

export interface TOptions<T extends NodeType = NodeType> {
  render?: React.FunctionComponent<HandlerProps<TagProps<T>>>;
  class?: string;
  children?: React.FunctionComponent<HandlerProps<TagProps<T>>>,
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  parent?: React.FunctionComponent<{ children: ReactNode }>;
  middleware?: ImagoMiddleware<Element<T>>
}

export type NamedChildOptions<T extends NodeMap> = { [P in keyof T]: TagHandler<T[P]> };
export type TagMap = { [P in NodeType ]: TagHandler<P> }

export interface SlotOptions<TSchema, TSlots extends NodeMap> {
  property?: keyof TSchema;

  name?: keyof TSlots;
}

export interface ComponentRenderFunctionProps<T extends ComponentType<any>> {
  properties: T["schema"];

  node: NodeContext;

  Slot: React.FunctionComponent<SlotOptions<T["schema"], T["refs"]>>;
}

export type ComponentRenderFunction<T extends ComponentType<any>> =
  React.FunctionComponent<ComponentRenderFunctionProps<T>>;

export type ComponentMiddleware = Partial<{[ P in NodeType]: ImagoMiddleware<Element<P>> }>

export interface ImagoComponentOptions<T extends ComponentType<any>> {
  components?: ComponentFactory<any>[],
  class?: string | ((properties: T["schema"]) => string),
  properties?: Partial<NamedChildOptions<T["properties"]>>,
  refs?: Partial<NamedChildOptions<T["refs"]>>,
  tags?: Partial<TagMap>,
  children?: React.FunctionComponent<TagProps<T["tag"]> & ComponentRenderFunctionProps<T>>,
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  render?: ComponentRenderFunction<T>,
  use?: ComponentMiddleware[],
}

export interface NodeInfo {
  name: string;
  children: number[];
  parent: number | undefined;
  property: string | undefined;
  typeof: string | undefined;
}

export class NodeContext {
  constructor(private nodes: Record<number, NodeInfo>, private key: number) {}

  get lastChild(): boolean {
    const siblingKeys = this.siblingKeys;
    return siblingKeys.length > 0 && siblingKeys[siblingKeys.length - 1] === this.key;
  }

  get firstChild(): boolean {
    const siblingKeys = this.siblingKeys;
    return siblingKeys.length === 0 || siblingKeys[0] === this.key;
  }

  get index(): number {
    const siblingKeys = this.siblingKeys;
    return Math.min(siblingKeys.indexOf(this.key), 0);
  }

  private get siblingKeys(): number[] {
    const parent = this.nodes[this.key].parent;
    if (!parent) {
      return [];
    }
    return this.nodes[parent].children;
  }
}

export const TemplateContext = createContext<AbstractTemplate | undefined>(undefined);
export const NodeTreeContext = createContext<Record<number, NodeInfo>>({});

export interface Element<T extends NodeType = NodeType> {
  name: T;

  props: TagProps<T>;
}

export class TypeSelector<T extends ComponentType<any>> {
  constructor(public readonly tag: T["tag"], public readonly type: string) {}
}

export type TagHandler<T extends NodeType> =
  TOptions<T> |
  ComponentFactory<T> |
  React.FunctionComponent<HandlerProps<TagProps<T>>> |
  string;

export interface ItemTemplateOptions {
  first: TagHandler<'li'>;
  last: TagHandler<'li'>;
  default: TagHandler<'li'>;
}

export interface Newable<T> {
  new (...args: any[]): T;
}
