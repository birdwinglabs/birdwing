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

export interface ValueProps extends NodeProps {
  content: string;
}

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
  T extends 'value' ? ValueProps :
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

export abstract class ComponentFactory<T extends NodeType> extends AbstractTemplateFactory {
  tag: T;

  type: string;

  //template(): AbstractTemplate;
}

//export interface ComponentType<TNode extends NodeType = NodeType, TProperties extends NodeMap = NodeMap, TSlots extends NodeMap = NodeMap> {
  //tag: TNode;

  //properties: TProperties;

  //slots: TSlots;
//}
export interface ComponentType<TSchema> {
  tag: NodeType;

  schema: TSchema;

  properties: {[P in keyof TSchema]: NodeType};

  slots: Record<string, NodeType>
}

export interface TOptions<T extends NodeType = NodeType> {
  render?: React.FunctionComponent<HandlerProps<TagProps<T>>>;
  class?: string;
  children?: React.FunctionComponent<HandlerProps<TagProps<T>>>,
  childAfter?: ReactNode;
  childBefore?: ReactNode;
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

  Slot: React.FunctionComponent<SlotOptions<T["schema"], T["slots"]>>;
}

export type ComponentRenderFunction<T extends ComponentType<any>> =
  React.FunctionComponent<ComponentRenderFunctionProps<T>>;

export type ComponentMiddleware = Partial<{[ P in NodeType]: ImagoMiddleware<Element<P>> }>

//let m: ComponentMiddleware = {
  //grid: next => props => {
    //let className = 'grid grid-cols-12';

    //const columns = () => {
      //switch (props.columns) {
        //case 1: return 'lg:grid-cols-1';
        //case 2: return 'lg:grid-cols-2';
      //}
    //}

    //if (props.columns) {

    //}

    //return next(props);
  //}
//}

export interface ImagoComponentOptions<T extends ComponentType<any>> {
  components?: ComponentFactory<any>[],
  class?: string | ((properties: T["schema"]) => string),
  properties?: Partial<NamedChildOptions<T["properties"]>>,
  slots?: Partial<NamedChildOptions<T["slots"]>>,
  tags?: Partial<TagMap>,
  children?: React.FunctionComponent<TagProps<T["tag"]> & ComponentRenderFunctionProps<T>>,
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  render?: ComponentRenderFunction<T>,
  use?: ComponentMiddleware[],
}

export const TemplateContext = createContext<AbstractTemplate | undefined>(undefined);

export interface Element<T extends NodeType = NodeType> {
  name: T;

  props: TagProps<T>;
}

export class TypeSelector<T extends ComponentType<any>> {
  constructor(public readonly tag: T["tag"], public readonly type: string) {}
}

//export interface SequencePaginationProperties extends PropertyMap {
  //nextPage: Property<'link', string>;
  //previousPage: Property<'link', string>;
//}

//export interface DocPageProperties extends PropertyMap {
  //topic: Property<'heading', string>;
  //name: Property<'heading', string>;
  //description: Property<'paragraph', string>;

  //summary: Property<'section', any>;
  //headings: Property<'section', any>;
  //pagination: Property<'section', SequencePagination["properties"]>;
//}

//export interface DocPageSlots extends NodeMap {
  //body: 'section';
//}

//export interface HintProperties extends PropertyMap {
  //hintType: Property<'value', 'caution' | 'check' | 'note' | 'warning'>;
  //message: Property<'section', any>;
//}

//type SequencePagination = ComponentType<'section', SequencePaginationProperties, {}>;
//type DocPage = ComponentType<'document', DocPageProperties, DocPageSlots>;
//type Hint = ComponentType<'section', HintProperties>;

//export const schema2 = {
  //SequentionalPagination: new TypeSelector<SequencePagination>('section', 'SequentialPagination'),
  //DocPage: new TypeSelector<DocPage>('document', 'DocPage'),
  //TableOfContents: new TypeSelector<any>('section', 'TableOfContents'),
  //Footer: new TypeSelector<any>('section', 'Footer'),
  //Menu: new TypeSelector<any>('section', 'Menu'),
  //Tabs: new TypeSelector<any>('section', 'TabGroup'),
  //TabList: new TypeSelector<any>('list', 'TabList'),
  //TabPanels: new TypeSelector<any>('list', 'TabPanels'),
  //Tab: new TypeSelector<any>('item', 'Tab'),
  //TabPanel: new TypeSelector<any>('item', 'TabPanel'),
  //Headings: new TypeSelector<any>('section', 'Headings'),
  //Steps: new TypeSelector<any>('list', 'Steps'),
  //Step: new TypeSelector<any>('item', 'Step'),
  //Hint: new TypeSelector<Hint>('section', 'Hint'),
//}

export type TagHandler<T extends NodeType> =
  TOptions<T> |
  ComponentFactory<T> |
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

export interface ItemTemplateOptions {
  first: TagHandler<'item'>;
  last: TagHandler<'item'>;
  default: TagHandler<'item'>;
}

export interface Newable<T> {
  new (...args: any[]): T;
}
