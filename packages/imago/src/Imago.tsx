import React, { isValidElement, createContext, FunctionComponent, ReactNode, useContext } from "react";
import { Template } from '@birdwing/react';
import {
  FenceProps,
  GridProps,
  HeadingProps,
  ImagoHandler,
  ImagoMiddleware,
  ItemProps,
  ListProps,
  NodeProps,
  NodeType,
  ParagraphProps,
  SectionProps,
  Selector,
  TemplateOptions,
  TileProps
} from "./interfaces.js";
import { defaultElements } from "./Elements.js";

const TemplateContext = createContext<Imago | undefined>(undefined);

export interface ProjectProps {
  template?: Imago;

  filter?: Selector<any> | Selector<any>[]

  children: React.ReactNode;

  enumerate?: boolean;
}

export class Ordering {
  constructor(public readonly index: number, public readonly total: number) {}

  get isFirst() { return this.index === 0; }
  get isLast() { return this.index === this.total - 1; }
}

export const OrderingContext = createContext(new Ordering(0, 0));


export interface SlotOptions {
  filter?: Record<string, any>;
}

export interface NodeFilter {
  className?: string;
}

export interface HeadingFilter extends NodeFilter {
  level?: number;
}

export type ImagoRender<T> = ImagoHandler<T> | string | string[] | false;

export interface MatchOptions<T> {
  match?: Partial<T>;
  matchClass?: string;
  matchClassNot?: string;
}

export interface ChangeClassOptions<T> extends MatchOptions<T> {
  add?: string;
  replace?: Record<string, string>;
  finish?: boolean;
}

export interface ChangeChildrenOptions<T> extends MatchOptions<T> {
  add?: ReactNode;
  replace?: ImagoHandler<T>;
  finish?: boolean;
}

export interface ChangeContextOptions<T> extends MatchOptions<T> {
  slot: string;
}

export interface ChangeElementOptions<T> extends MatchOptions<T> {
  replace: string | FunctionComponent;
}

export interface ReplaceOptions<T> extends MatchOptions<T> {
  render: ImagoHandler<T>;
}

export interface AttributeToClassOptions<T> extends MatchOptions<T> {
  name: string;
  values: Record<string | number, string>;
}

export interface TransformOptions<T> {
  addClass?: string | string[];
  template?: Imago;
  replaceChildren?: ImagoHandler<T>;
  addChild?: ReactNode;
  final?: boolean;
}


export interface ImagoBuilder {
  template(): Imago;

  //class(type: 'layout', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'section', options: ChangeClassOptions<SectionProps>): ImagoBuilder;
  //class(type: 'grid', options: ChangeClassOptions<GridProps>): ImagoBuilder;
  //class(type: 'tile', options: ChangeClassOptions<TileProps>): ImagoBuilder;
  //class(type: 'heading', options: ChangeClassOptions<HeadingProps>): ImagoBuilder;
  //class(type: 'paragraph', options: ChangeClassOptions<ParagraphProps>): ImagoBuilder;
  //class(type: 'hr', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'image', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'fence', options: ChangeClassOptions<FenceProps>): ImagoBuilder;
  //class(type: 'html', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'blockquote', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'list', options: ChangeClassOptions<ListProps>): ImagoBuilder;
  //class(type: 'item', options: ChangeClassOptions<ItemProps>): ImagoBuilder;
  //class(type: 'strong', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  //class(type: 'link', options: ChangeClassOptions<LinkProps>): ImagoBuilder;
  //class(type: 'code', options: ChangeClassOptions<NodeProps>): ImagoBuilder;

  //element(type: 'layout', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'section', options: ChangeElementOptions<SectionProps>): ImagoBuilder;
  //element(type: 'grid', options: ChangeElementOptions<GridProps>): ImagoBuilder;
  //element(type: 'tile', options: ChangeElementOptions<TileProps>): ImagoBuilder;
  //element(type: 'heading', options: ChangeElementOptions<HeadingProps>): ImagoBuilder;
  //element(type: 'paragraph', options: ChangeElementOptions<ParagraphProps>): ImagoBuilder;
  //element(type: 'hr', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'image', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'fence', options: ChangeElementOptions<FenceProps>): ImagoBuilder;
  //element(type: 'html', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'blockquote', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'list', options: ChangeElementOptions<ListProps>): ImagoBuilder;
  //element(type: 'item', options: ChangeElementOptions<ItemProps>): ImagoBuilder;
  //element(type: 'strong', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  //element(type: 'link', options: ChangeElementOptions<LinkProps>): ImagoBuilder;
  //element(type: 'code', options: ChangeElementOptions<NodeProps>): ImagoBuilder;

  //children(type: 'layout', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'section', options: ChangeChildrenOptions<SectionProps>): ImagoBuilder;
  //children(type: 'grid', options: ChangeChildrenOptions<GridProps>): ImagoBuilder;
  //children(type: 'tile', options: ChangeChildrenOptions<TileProps>): ImagoBuilder;
  //children(type: 'heading', options: ChangeChildrenOptions<HeadingProps>): ImagoBuilder;
  //children(type: 'paragraph', options: ChangeChildrenOptions<ParagraphProps>): ImagoBuilder;
  //children(type: 'hr', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'image', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'fence', options: ChangeChildrenOptions<FenceProps>): ImagoBuilder;
  //children(type: 'html', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'blockquote', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'list', options: ChangeChildrenOptions<ListProps>): ImagoBuilder;
  //children(type: 'item', options: ChangeChildrenOptions<ItemProps>): ImagoBuilder;
  //children(type: 'strong', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  //children(type: 'link', options: ChangeChildrenOptions<LinkProps>): ImagoBuilder;
  //children(type: 'code', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;

  //replace(type: 'layout', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'section', options: ReplaceOptions<SectionProps>): ImagoBuilder;
  //replace(type: 'grid', options: ReplaceOptions<GridProps>): ImagoBuilder;
  //replace(type: 'tile', options: ReplaceOptions<TileProps>): ImagoBuilder;
  //replace(type: 'heading', options: ReplaceOptions<HeadingProps>): ImagoBuilder;
  //replace(type: 'paragraph', options: ReplaceOptions<ParagraphProps>): ImagoBuilder;
  //replace(type: 'hr', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'image', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'fence', options: ReplaceOptions<FenceProps>): ImagoBuilder;
  //replace(type: 'html', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'blockquote', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'list', options: ReplaceOptions<ListProps>): ImagoBuilder;
  //replace(type: 'item', options: ReplaceOptions<ItemProps>): ImagoBuilder;
  //replace(type: 'strong', options: ReplaceOptions<NodeProps>): ImagoBuilder;
  //replace(type: 'link', options: ReplaceOptions<LinkProps>): ImagoBuilder;
  //replace(type: 'code', options: ReplaceOptions<NodeProps>): ImagoBuilder;

  attributeToClass(type: NodeType, options: AttributeToClassOptions<NodeProps>): ImagoBuilder;
  addClasses(classes: Partial<Record<NodeType, string>>): ImagoBuilder;

  use(middleware: ImagoBuilder): ImagoBuilder;
  use(type: 'layout', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'section', middleware: ImagoMiddleware<SectionProps>): ImagoBuilder;
  use(type: 'grid', middleware: ImagoMiddleware<GridProps>): ImagoBuilder;
  use(type: 'tile', middleware: ImagoMiddleware<TileProps>): ImagoBuilder;
  use(type: 'heading', middleware: ImagoMiddleware<HeadingProps>): ImagoBuilder;
  use(type: 'paragraph', middleware: ImagoMiddleware<ParagraphProps>): ImagoBuilder;
  use(type: 'hr', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'image', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'fence', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'html', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'blockquote', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'list', middleware: ImagoMiddleware<ListProps>): ImagoBuilder;
  use(type: 'item', middleware: ImagoMiddleware<ItemProps>): ImagoBuilder;
  use(type: 'strong', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'link', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'code', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
}

export class ImagoBuilder {
  constructor(
    public readonly name: string,
    private final: Record<string, ImagoHandler> = { ...defaultElements },
    public  middleware: Record<string, ImagoMiddleware[]> = {},
  ) {}

  template() {
    return new Imago(this.name, this.createHandlers());
  }

  private createHandlers() {
    const handlerMap: Record<string, ImagoHandler> = { ...this.final };

    for (const [name, middleware] of Object.entries(this.middleware)) {
      const final = this.final[name];

      for (const mw of middleware) {
        let next = handlerMap[name];
        if (!next) {
          throw Error(`Next handler missing for '${name}'`);
        }
        handlerMap[name] = props => mw(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)
      }
    }
    return handlerMap;
  }

  transform<T extends NodeProps>(selector: Selector<T>, options: TransformOptions<T>) {
    return this.use(selector.type, Imago.transform(selector, options));
  }

  render<T extends NodeProps>(selector: Selector<T>, component: ImagoHandler<T>) {
    return this.use(selector.type, Imago.render(selector, component));
  }

  class<T extends NodeProps>(type: NodeType, options: ChangeClassOptions<T>) {
    return this.use(type, Imago.changeClass(options));
  }

  element<T extends NodeProps>(type: NodeType, options: ChangeElementOptions<T>) {
    return this.use(type, Imago.changeElement(options));
  }

  children<T extends NodeProps>(type: NodeType, options: ChangeChildrenOptions<T>) {
    return this.use(type, Imago.changeChildren(options));
  }

  replace<T extends NodeProps>(type: NodeType, options: ReplaceOptions<T>) {
    return this.use(type, Imago.replace(options));
  }

  attributeToClass(type: NodeType, options: AttributeToClassOptions<NodeProps>) {
    return this.use(type, Imago.attributeToClass(options));
  }

  addClasses(classes: Partial<Record<NodeType, string>>) {
    for (const type of Object.keys(classes)) {
      this.class(type as NodeType, {
        add: classes[type as NodeType]
      });
    }
    return this;
  }

  public use<T = any>(arg1: string | ImagoBuilder, arg2?: ImagoMiddleware<T>): this {
    if (typeof arg1 === 'string' && arg2) {
      if (!this.middleware[arg1]) {
        this.middleware[arg1] = [];
      }
      this.middleware[arg1].unshift(arg2);
    }

    if (typeof arg1 === 'object') {
      for (const [name, middleware] of Object.entries(arg1.middleware)) {
        for (const m of middleware) {
          this.use(name, m);
        }
      }
    }

    return this;
  }
}


function isMatching<T extends NodeProps>(props: T, { match, matchClass, matchClassNot }: MatchOptions<T>) {
  return Object.entries(match || {}).every(([k, v]) => (props as any)[k] === v)
    && (matchClass ? ((props.className || '') as string).split(' ').indexOf(matchClass) >= 0 : true)
    && (matchClassNot ? ((props.className || '') as string).split(' ').indexOf(matchClassNot) < 0 : true)
}

export class Imago extends Template {
  constructor(
    public readonly name: string,
    private handlers: Record<string, ImagoHandler>,
  ) {
    super();
  }

  static configure(name: string, options?: TemplateOptions) {
    const final = { ...defaultElements, ...options?.elements || {} };

    const slots = (options?.slots || []).reduce((slots, slot) => {
      slots[(slot as any).name] = slot;
      return slots;
    }, {} as Record<string, Template>);

    return new ImagoBuilder(name, final, {});
  }

  static changeClass<T extends NodeProps>({ add, replace, finish, ...matchOptions }: ChangeClassOptions<T>): ImagoMiddleware<T> {
    return (next, final) => props => {
      const n = finish ? final : next;

      if (isMatching(props, matchOptions)) {
        let newClass: string = props.className || '';
        for (const [k, v] of Object.entries(replace || {})) {
          newClass = newClass.replace(k, v);
        }
        if (add) {
          newClass = [newClass, add].join(' ');
        }
        return n({ ...props, className: newClass });
      } else {
        return next(props);
      }
    }
  }

  static changeChildren<T extends NodeProps>({ add, replace, finish, ...matchOptions }: ChangeChildrenOptions<T>): ImagoMiddleware<T> {
    return (next, final) => props => {
      const n = finish ? final : next;

      if (isMatching(props, matchOptions)) {
        if (add) {
          return n({ ...props, children: <>{ props.children } { add }</>})
        }
        if (replace) {
          return n({ ...props, children: replace(props) })
        }
      }
      return next(props);
    }
  }

  static replace<T extends NodeProps>({ render, ...matchOptions }: ReplaceOptions<T>): ImagoMiddleware<T> {
    return (next, final) => props => {
      return (isMatching(props, matchOptions)) ? render(props) : next(props);
    }
  }

  static render<T extends NodeProps>(selector: Selector<T>, component: ImagoHandler<T>): ImagoMiddleware<T> {
    return next => props => {
      return selector.match(props) ? component(props) : next(props);
    }
  }

  static transform<T extends NodeProps>(selector: Selector<T>, { addClass, template, replaceChildren, addChild, final }: TransformOptions<T>): ImagoMiddleware<T> {
    return (next, finish) => props => {
      const n = final ? finish : next;

      if (!selector.match(props)) {
        return next(props);
      }

      let p = props;

      if (addClass) {
        const oldClass = props.className as string || '';
        const newClass = Array.isArray(addClass) ? addClass.join(' ') : addClass;
        p = { ...p, className: [oldClass, newClass].join(' ').trim() };
      }

      if (replaceChildren) {
        p = { ...p, children: replaceChildren(p) }
      }
      
      if (addChild) {
        p = { ...p, children: <>{ p.children } { addChild }</> }
      }

      if (template) {
        p = { ...p, children: (
          <TemplateContext.Provider value={template}>{ p.children }</TemplateContext.Provider>
        )}
      }

      return n(p);
    }
  }

  static changeElement<T extends NodeProps>({ replace, ...matchOptions }: ChangeElementOptions<T>): ImagoMiddleware<T> {
    return next => ({ children, ...props }) => isMatching({ children, ...props } as any, matchOptions)
      ? React.createElement(replace, props as any, children)
      : next({ children, ...props } as any);
  }

  static attributeToClass<T extends NodeProps>({ name, values, ...matchOptions }: AttributeToClassOptions<T>): ImagoMiddleware<T> {
    return next => props => {
      if (isMatching(props, matchOptions) && props[name] in values) {
        return next({ ...props, className: [props.className, values[props[name]]].join(' ') });
      } else {
        return next(props);
      }
    }
  }

  static Project({ template, children, filter, enumerate }: ProjectProps) {
    if (filter) {
      const filters = Array.isArray(filter) ? filter : [filter];
      children = React.Children.toArray(children).filter(c => {
        if (isValidElement(c)) {
          return filters.some(f => f.type === (c.type as any).displayName && f.match(c.props));
        }
        return false;
      });
    }

    return template
      ? <TemplateContext.Provider value={template}>{ children }</TemplateContext.Provider>
      : <>{ children }</>;
  }

  static ordered = (children: React.ReactElement[]) => {
    const total = React.Children.count(children);

    const ordered = React.Children.map(children, (c, i) =>
      <OrderingContext.Provider value={new Ordering(i, total)}>
        { c }
      </OrderingContext.Provider> 
    )
    return ordered;
  }

  resolve(node: string) {
    if (node === 'layout') {
      return (props: any) => (
        <TemplateContext.Provider value={undefined}>
          { this.handlers['layout'](props) }
        </TemplateContext.Provider>
      );
    }

    const Component: React.FunctionComponent = (p: any) => {
      const template = useContext(TemplateContext)

      if (template && template.name !== this.name) {
        return template.resolve(node)(p);
      } else {
        const handler = this.handlers[node];

        if (handler) {
          return handler(p)
        }
      }
      return null;
    }

    Component.displayName = node;
    return Component;
  }
}
