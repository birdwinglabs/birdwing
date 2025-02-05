import React, { createContext, ReactNode } from "react";

export interface NodeProps extends Record<string, any>{
  id?: string;
  className?: string | any;
  children?: React.ReactNode;
  typeof?: string;
  property?: string;
  'data-name'?: string;
}

export interface MetaProps extends NodeProps {
  content: string;
}

export interface LinkProps extends NodeProps {
  href: string;
}

export interface MetaProps extends NodeProps {
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

export abstract class MiddlewareFactory<T extends NodeType> {
  abstract createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>>;
}

export type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];

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

export type HandlerProps<T extends NodeProps, TSlot extends React.FunctionComponent<any> = React.FunctionComponent<{}>> = T & { Slot: TSlot };

export type TagProps<T extends NodeType> = 
  T extends 'pre' ? FenceProps :
  T extends 'a' ? LinkProps :
  T extends 'meta' ? MetaProps :
  NodeProps;

export type NodeMap = Record<string, NodeType>;

export abstract class AbstractTemplate {
  abstract resolve(node: string): React.FunctionComponent<any>;
}

export abstract class ComponentFactory<T extends NodeType> {
  tag: T;

  type: string;

  abstract createTemplate(nodes: Record<number, NodeInfo>, props: TagProps<T>): AbstractTemplate;
}

export interface ComponentType<TSchema> {
  tag: NodeType;

  schema: TSchema;

  properties: {[P in keyof TSchema]: NodeType};

  refs: Record<string, NodeType>
}

export interface TransformOptions<T extends NodeType, TSlot extends React.FunctionComponent<any> = React.FunctionComponent<{}>> {
  render?: React.FunctionComponent<HandlerProps<TagProps<T>, TSlot>>;
  class?: string;
  children?: React.FunctionComponent<HandlerProps<TagProps<T>, TSlot>>,
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  parent?: React.FunctionComponent<{ children: ReactNode }>;
}

export type ReferencesOptions<T extends ComponentType<any>> =
  { [P in keyof T["refs"]]: TagHandler<T["refs"][P], undefined> };

export type PropertiesOptions<T extends ComponentType<any>> = 
  { [P in keyof T["properties"]]: PropertyHandler<T["properties"][P], T["schema"][P]> };

export type TagMap = { [P in NodeType ]: TagHandler<P, undefined> }

export interface SlotOptions<TSchema, TSlots extends NodeMap> {
  property?: keyof TSchema;

  name?: keyof TSlots;
}

export interface ComponentRenderFunctionProps<T extends ComponentType<any>> {
  Slot: React.FunctionComponent<SlotOptions<T["schema"], T["refs"]>>;
}

export type ComponentRenderFunction<T extends ComponentType<any>> =
  React.FunctionComponent<ComponentRenderFunctionProps<T>>;

export type ComponentMiddleware = Partial<{[ P in NodeType]: ImagoMiddleware<Element<P>> }>

export interface ImagoComponentOptions<T extends ComponentType<any>> extends TransformOptions<T["tag"], React.FunctionComponent<SlotOptions<T["schema"], T["refs"]>>> {
  components?: ComponentFactory<any>[],
  properties?: Partial<PropertiesOptions<T>>,
  refs?: Partial<ReferencesOptions<T>>,
  tags?: Partial<TagMap>,
  use?: ComponentMiddleware[],
}

export interface NodeInfo<T = any> {
  name: string;
  element: React.ReactNode | undefined;
  children: number[];
  refs: Record<string, number>;
  properties: Record<string, number>;
  parent: number | undefined;
  property: string | undefined;
  typeof: string | undefined;
  meta: T;
}

export class NodeContext<T> {
  private classes: Set<string>;

  constructor(
    private nodes: Record<number, NodeInfo>,
    private props: NodeProps
  ) {
    this.classes = new Set(props.className ? props.className.split(' ') : []);
  }

  get className(): string | undefined {
    return this.props.className;
  }

  hasClass(name: string): boolean {
    return this.classes.has(name);
  }

  get data(): T {
    return this.nodes[this.key].meta;
  }

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
    return Math.max(siblingKeys.indexOf(this.key), 0);
  }

  private get key() {
    return this.props.k;
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

export interface Element<T extends NodeType = NodeType> {
  name: T;

  props: TagProps<T>;
}

export class TypeSelector<T extends ComponentType<any>> {
  constructor(public readonly tag: T["tag"], public readonly type: string) {}
}

type ArrayElement<ArrayType extends readonly unknown[] | unknown> = 
  ArrayType extends readonly (infer ElementType)[] ? ElementType : ArrayType;


export type TagHandler<T extends NodeType, TSchema> =
  TransformOptions<T> |
  MiddlewareFactory<T> |
  ((node: NodeContext<ArrayElement<TSchema>>) => TagHandler<T, ArrayElement<TSchema>>) |
  string;

export type PropertyHandler<T extends NodeType, TSchema> =
  TagHandler<T, TSchema> |
  ComponentFactory<T>;

export interface Newable<T> {
  new (...args: any[]): T;
}
