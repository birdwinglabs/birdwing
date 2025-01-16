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

export interface ListProps extends NodeProps {
  ordered: boolean;
}

export interface ItemProps extends NodeProps {}

export interface FenceProps extends NodeProps {
  children: string;
  language: string;
  html?: boolean;
  height?: string;
}

export interface HeadingProps extends NodeProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphProps extends NodeProps {}

export type ImagoHandler<T = any> = React.FunctionComponent<T>;
export type ImagoMiddleware<T = any> = (next: ImagoHandler<T> | (() => React.ReactElement | null), final: ImagoHandler<T>) => ImagoHandler<T>;
export type Middleware<T = any> = (props: T, next: ImagoHandler<T>) => React.FunctionComponent<T>;

export interface MiddlewareComponent {
  apply(): void;
}

export type NodeType = 
  'document' |
  'value' |
  'section' |
  'grid' |
  'tile' |
  'heading' |
  'paragraph' |
  'hr' |
  'image' |
  'fence' |
  'html' |
  'blockquote' |
  'list' |
  'item' |
  'strong' |
  'link' |
  'code';

export type HandlerProps<T extends NodeProps> = T & { Slot: any };

export type TagProps<T extends NodeType> = 
  T extends 'grid' ? GridProps :
  T extends 'tile' ? TileProps :
  T extends 'heading' ? HeadingProps :
  T extends 'paragraph' ? ParagraphProps :
  T extends 'fence' ? FenceProps :
  T extends 'list' ? ListProps :
  T extends 'item' ? ItemProps :
  T extends 'link' ? LinkProps :
  NodeProps;

export abstract class AbstractSelector<T extends NodeType> {
  constructor(public readonly types: NodeType[]) {}

  abstract match(props: TagProps<T>): boolean;
}

export interface TemplateOptions {
  slots?: Template[],
  elements?: Record<string, ImagoHandler>;
  selector?: AbstractSelector<any>;
}

export type Matcher<T extends NodeProps> = (props: T) => boolean;



///////////////////////////////////// NEW //////////////////////////////////////

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

export interface ComponentFactory {
  tag: NodeType;

  type: string;

  template(): AbstractTemplate;
}

export interface ComponentType<TNode extends NodeType = NodeType, TProperties extends PropertyMap = PropertyMap, TSlots extends NodeMap = NodeMap> {
  tag: TNode;

  properties: TProperties;

  slots: TSlots;
}

export interface TOptions<T extends NodeType = NodeType> {
  render?: React.FunctionComponent<HandlerProps<TagProps<T>>>;
  class?: string;
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  middleware?: ImagoMiddleware<Element<T>>
}

//export type NamedChildOptions<T extends NodeMap> = { [P in keyof T]: TOptions<T[P]> | string };
export type NamedChildOptions<T extends NodeMap> = { [P in keyof T]: TagHandler<T[P]> };
//export type TagOptions<T extends NodeMap> = { [P in keyof T]: TOptions<TagProps<T[P]>> | string };
export type TagMap = { [P in NodeType ]: TagHandler<P> }
  //TOptions<P> | string | ImagoMiddleware<Element<P>> };


//type PropertyMap<T extends NodeMap> = { [P in keyof T]: Property<T[P]> };

//type PropertyValue<T extends NodeType> = string;

//interface Property<T extends NodeType> {
  //value: PropertyValue<T>;

  //Slot: React.FunctionComponent<{}>;
//}

export interface SlotOptions<TProperties extends PropertyMap, TSlots extends NodeMap> {
  property?: keyof TProperties;

  name?: keyof TSlots;
}

export interface ComponentRenderFunctionProps<T extends PropertyMap, TSlots extends NodeMap> {
  properties: PropertyTypes<T>;

  Slot: React.FunctionComponent<SlotOptions<T, TSlots>>;
}

export type ComponentRenderFunction<T extends ComponentType> =
  React.FunctionComponent<ComponentRenderFunctionProps<T["properties"], T["slots"]>>;

export interface ImagoComponentOptions<T extends ComponentType> {
  components?: ComponentFactory[],
  class?: string | ((properties: PropertyTypes<T["properties"]>) => string),
  properties?: Partial<NamedChildOptions<PropertyNodes<T["properties"]>>>,
  slots?: Partial<NamedChildOptions<T["slots"]>>,
  tags?: Partial<TagMap>,
  children?: React.FunctionComponent<HandlerProps<TagProps<T["tag"]>>>,
  render?: ComponentRenderFunction<T>,
}

//class PropertyAccess<T extends NodeType> implements Property<T> {
  //constructor(private children: React.ReactNode, private property: string) {
    ////for (const child of React.Children.toArray(children)) {

    ////}
  //}

  //get value() {
    //return this.property;
  //}

  //Slot() {
    //return this.children;
  //}
//}


export const TemplateContext = createContext<AbstractTemplate | undefined>(undefined);

export interface Element<T extends NodeType = NodeType> {
  name: T;

  props: TagProps<T>;
}


export class TypeSelector<T extends ComponentType> {
  constructor(public readonly tag: T["tag"], public readonly type: string) {}
}



export interface SequencePaginationProperties extends PropertyMap {
  nextPage: Property<'link', string>;
  previousPage: Property<'link', string>;
}

export interface DocPageProperties extends PropertyMap {
  topic: Property<'heading', string>;
  name: Property<'heading', string>;
  description: Property<'paragraph', string>;

  summary: Property<'section', any>;
  headings: Property<'section', any>;
  pagination: Property<'section', SequencePagination["properties"]>;
}

export interface DocPageSlots extends NodeMap {
  body: 'section';
}

type SequencePagination = ComponentType<'section', SequencePaginationProperties, {}>;
type DocPage = ComponentType<'document', DocPageProperties, DocPageSlots>;

export const schema2 = {
  SequentionalPagination: new TypeSelector<SequencePagination>('section', 'SequentialPagination'),
  DocPage: new TypeSelector<DocPage>('document', 'DocPage'),
  TableOfContents: new TypeSelector<any>('section', 'TableOfContents'),
  Footer: new TypeSelector<any>('section', 'Footer'),
  Menu: new TypeSelector<any>('section', 'Menu'),
}

abstract class TagTemplate<T extends NodeType> {
  resolve(props: TagProps<T>) {

  }
}

class HeadingTemplate extends TagTemplate<'heading'> {

}

export type TagHandler<T extends NodeType> =
  TOptions<T> |
  React.FunctionComponent<HandlerProps<TagProps<T>>> |
  string;

export interface HeadingTemplateOptions {
  h1: TagHandler<'heading'>;
  h2: TagHandler<'heading'>;
  h3: TagHandler<'heading'>;
  h4: TagHandler<'heading'>;
  h5: TagHandler<'heading'>;
  h6: TagHandler<'heading'>;
}
