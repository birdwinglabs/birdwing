import React, { createContext, FunctionComponent, ReactNode, useContext } from "react";
import { Template } from '@birdwing/react';
import {
  FenceProps,
  HeadingProps,
  ImagoHandler,
  ImagoMiddleware,
  ItemProps,
  ListProps,
  NodeProps,
  ParagraphProps,
  ProjectProps,
  SectionProps,
  TemplateOptions
} from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { LinkProps } from "react-router-dom";

const TemplateContext = createContext<string | undefined>(undefined);

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

export type NodeType = 'section' | 'heading' | 'paragraph' | 'hr' | 'image' | 'fence' | 'blockquote' | 'list' | 'item' | 'strong' | 'link' | 'code';

export interface ImagoBuilder {
  slot(): Imago;
  layout<T = any>(render: ImagoHandler<T>): Imago;

  changeClass(type: 'section', options: ChangeClassOptions<SectionProps>): ImagoBuilder;
  changeClass(type: 'heading', options: ChangeClassOptions<HeadingProps>): ImagoBuilder;
  changeClass(type: 'paragraph', options: ChangeClassOptions<ParagraphProps>): ImagoBuilder;
  changeClass(type: 'hr', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  changeClass(type: 'image', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  changeClass(type: 'fence', options: ChangeClassOptions<FenceProps>): ImagoBuilder;
  changeClass(type: 'blockquote', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  changeClass(type: 'list', options: ChangeClassOptions<ListProps>): ImagoBuilder;
  changeClass(type: 'item', options: ChangeClassOptions<ItemProps>): ImagoBuilder;
  changeClass(type: 'strong', options: ChangeClassOptions<NodeProps>): ImagoBuilder;
  changeClass(type: 'link', options: ChangeClassOptions<LinkProps>): ImagoBuilder;
  changeClass(type: 'code', options: ChangeClassOptions<NodeProps>): ImagoBuilder;

  changeElement(type: 'section', options: ChangeElementOptions<SectionProps>): ImagoBuilder;
  changeElement(type: 'heading', options: ChangeElementOptions<HeadingProps>): ImagoBuilder;
  changeElement(type: 'paragraph', options: ChangeElementOptions<ParagraphProps>): ImagoBuilder;
  changeElement(type: 'hr', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  changeElement(type: 'image', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  changeElement(type: 'fence', options: ChangeElementOptions<FenceProps>): ImagoBuilder;
  changeElement(type: 'blockquote', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  changeElement(type: 'list', options: ChangeElementOptions<ListProps>): ImagoBuilder;
  changeElement(type: 'item', options: ChangeElementOptions<ItemProps>): ImagoBuilder;
  changeElement(type: 'strong', options: ChangeElementOptions<NodeProps>): ImagoBuilder;
  changeElement(type: 'link', options: ChangeElementOptions<LinkProps>): ImagoBuilder;
  changeElement(type: 'code', options: ChangeElementOptions<NodeProps>): ImagoBuilder;

  changeChildren(type: 'section', options: ChangeChildrenOptions<SectionProps>): ImagoBuilder;
  changeChildren(type: 'heading', options: ChangeChildrenOptions<HeadingProps>): ImagoBuilder;
  changeChildren(type: 'paragraph', options: ChangeChildrenOptions<ParagraphProps>): ImagoBuilder;
  changeChildren(type: 'hr', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  changeChildren(type: 'image', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  changeChildren(type: 'fence', options: ChangeChildrenOptions<FenceProps>): ImagoBuilder;
  changeChildren(type: 'blockquote', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  changeChildren(type: 'list', options: ChangeChildrenOptions<ListProps>): ImagoBuilder;
  changeChildren(type: 'item', options: ChangeChildrenOptions<ItemProps>): ImagoBuilder;
  changeChildren(type: 'strong', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;
  changeChildren(type: 'link', options: ChangeChildrenOptions<LinkProps>): ImagoBuilder;
  changeChildren(type: 'code', options: ChangeChildrenOptions<NodeProps>): ImagoBuilder;

  section(render: ImagoHandler<SectionProps> | false): ImagoBuilder;
  section(newClass: string | string[]): ImagoBuilder;
  section(match: NodeFilter, render: ImagoRender<SectionProps>): ImagoBuilder;

  heading(render: ImagoHandler<HeadingProps> | false): ImagoBuilder;
  heading(newClass: string | string[]): ImagoBuilder;
  heading(match: HeadingFilter, render: ImagoRender<HeadingProps>): ImagoBuilder;

  h1(newClass: string): ImagoBuilder;
  h1(render: ImagoHandler<HeadingProps> | false): ImagoBuilder;
  h1(match: HeadingFilter, render: ImagoRender<HeadingProps>): ImagoBuilder;

  h2(newClass: string): ImagoBuilder;
  h2(render: ImagoHandler<HeadingProps> | false): ImagoBuilder;
  h2(match: HeadingFilter, render: ImagoRender<HeadingProps>): ImagoBuilder;

  paragraph(render: ImagoHandler<ParagraphProps> | false): ImagoBuilder;
  paragraph(newClass: string | string[]): ImagoBuilder;
  paragraph(match: NodeFilter, render: ImagoRender<ParagraphProps>): ImagoBuilder;

  strong(render: ImagoHandler<NodeProps> | false): ImagoBuilder;
  strong(newClass: string | string[]): ImagoBuilder;
  strong(match: NodeFilter, render: ImagoRender<NodeProps>): ImagoBuilder;

  code(render: ImagoHandler<NodeProps> | false): ImagoBuilder;
  code(newClass: string | string[]): ImagoBuilder;
  code(match: NodeFilter, render: ImagoRender<NodeProps>): ImagoBuilder;

  image(render: ImagoHandler<NodeProps> | false): ImagoBuilder;
  image(newClass: string | string[]): ImagoBuilder;
  image(match: NodeFilter, render: ImagoRender<NodeProps>): ImagoBuilder;

  svg(render: ImagoHandler<NodeProps> | false): ImagoBuilder;
  svg(newClass: string | string[]): ImagoBuilder;
  svg(match: NodeFilter, render: ImagoRender<NodeProps>): ImagoBuilder;

  list(render: ImagoHandler<ListProps> | false): ImagoBuilder;
  list(newClass: string | string[]): ImagoBuilder;
  list(match: NodeFilter, render: ImagoRender<ListProps>): ImagoBuilder;

  item(render: ImagoHandler<ItemProps> | false): ImagoBuilder;
  item(newClass: string | string[]): ImagoBuilder;
  item(match: NodeFilter, render: ImagoRender<ItemProps>): ImagoBuilder;

  fence(render: ImagoHandler<FenceProps> | false): ImagoBuilder;
  fence(newClass: string | string[]): ImagoBuilder;
  fence(match: NodeFilter, render: ImagoRender<FenceProps>): ImagoBuilder;

  link(handler: ImagoHandler<LinkProps> | false): ImagoBuilder;
  link(newClass: string | string[]): ImagoBuilder;
  link(match: NodeFilter, render: ImagoRender<LinkProps>): ImagoBuilder;

  use(middleware: ImagoBuilder): ImagoBuilder;
  use(type: 'section', middleware: ImagoMiddleware<SectionProps>): ImagoBuilder;
  use(type: 'heading', middleware: ImagoMiddleware<HeadingProps>): ImagoBuilder;
  use(type: 'paragraph', middleware: ImagoMiddleware<ParagraphProps>): ImagoBuilder;
  use(type: 'hr', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'image', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'fence', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
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
    private slots: Record<string, Template> = {}
  ) {}

  layout<T = any>(render: ImagoHandler<T>) {
    const handlers = this.createHandlers();
    handlers['layout'] = render;

    return new Imago(this.name, handlers, this.slots);
  }

  slot() {
    return new Imago(this.name, this.createHandlers(), this.slots);
  }

  private createHandlers() {
    const handlerMap: Record<string, ImagoHandler> = { ...this.final };

    for (const [name, middleware] of Object.entries(this.middleware)) {
      const final = this.final[name];

      for (const mw of middleware) {
        let next = handlerMap[name];
        handlerMap[name] = props => mw(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)
      }
    }
    return handlerMap;
  }

  changeClass<T extends NodeProps>(type: NodeType, options: ChangeClassOptions<T>) {
    return this.use(type, Imago.changeClass(options));
  }

  changeElement<T extends NodeProps>(type: NodeType, options: ChangeElementOptions<T>) {
    return this.use(type, Imago.changeElement(options));
  }

  changeChildren<T extends NodeProps>(type: NodeType, options: ChangeChildrenOptions<T>) {
    return this.use(type, Imago.changeChildren(options));
  }

  changeContext<T extends NodeProps>(type: NodeType, options: ChangeContextOptions<T>) {
    return this.changeChildren(type, {
      ...options,
      replace: ({ children }) => <Imago.Project slot={options.slot} nodes={children as any}></Imago.Project>
    });
  }

  h1(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(1, arg1, arg2);
  }
  h2(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(2, arg1, arg2);
  }
  h3(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(3, arg1, arg2);
  }
  h4(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(4, arg1, arg2);
  }
  h5(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(5, arg1, arg2);
  }
  h6(arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.h(6, arg1, arg2);
  }

  private h(level: number, arg1: NodeFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return typeof arg1 === 'object' && !Array.isArray(arg1)
      ? this.match<HeadingFilter>('heading', { ...arg1, level }, arg2 || false)
      : this.match<HeadingFilter>('heading', { level }, arg1)
  }

  section(arg1: ImagoRender<SectionProps> | NodeFilter, arg2?: ImagoRender<SectionProps>) {
    return this.define('section', arg1, arg2);
  }

  heading(arg1: HeadingFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.define('heading', arg1, arg2);
  }

  paragraph(arg1: ImagoRender<ParagraphProps> | NodeFilter, arg2?: ImagoRender<ParagraphProps>) {
    return this.define('paragraph', arg1, arg2);
  }

  strong(arg1: ImagoRender<NodeProps> | NodeFilter, arg2?: ImagoRender<NodeProps>) {
    return this.define('strong', arg1, arg2);
  }

  code(arg1: ImagoRender<NodeProps> | NodeFilter, arg2?: ImagoRender<NodeProps>) {
    return this.define('code', arg1, arg2);
  }

  image(arg1: ImagoRender<NodeProps> | NodeFilter, arg2?: ImagoRender<NodeProps>) {
    return this.define('image', arg1, arg2);
  }

  svg(arg1: ImagoRender<NodeProps> | NodeFilter, arg2?: ImagoRender<NodeProps>) {
    return this.define('svg', arg1, arg2);
  }

  list(arg1: ImagoRender<ListProps> | NodeFilter, arg2?: ImagoRender<ListProps>) {
    return this.define('list', arg1, arg2);
  }

  item(arg1: ImagoRender<ItemProps> | NodeFilter, arg2?: ImagoRender<ItemProps>) {
    return this.define('item', arg1, arg2);
  }

  link(arg1: ImagoRender<LinkProps> | NodeFilter, arg2?: ImagoRender<LinkProps>) {
    return this.define('link', arg1, arg2);
  }

  fence(arg1: ImagoRender<FenceProps> | NodeFilter, arg2?: ImagoRender<FenceProps>) {
    return this.define('fence', arg1, arg2);
  }

  private match<TFilter extends NodeFilter = NodeFilter>(type: string, filter: TFilter, render: ImagoRender<any>): this {
    const match = (props: any) => Object.entries(filter).every(([key, value]) => props[key] === value);

    switch (typeof render) {
      case 'boolean':
        return this.use(type, next => props => match(props) ? null : next(props));
      case 'function':
        return this.use(type, next => props => match(props) ? render(props) : next(props))
      case 'object':
      case 'string':
        return this.use(type, (next, final) => props => match(props) ? final({
           ...props,
           className: Array.isArray(render) ? render.join(' ') : render
        }) : next(props))
    }
  }

  private define<TFilter extends NodeFilter = NodeFilter>(type: string, arg1: ImagoRender<any> | TFilter, arg2?: ImagoRender<any>): this {
    switch (typeof arg1) {
      case 'object': return Array.isArray(arg1)
        ? this.use(type, (next, final) => props => final({ ...props, className: arg1.join(' ') }))
        : this.match(type, arg1, arg2 || false);
      case 'string': return this.use(type, (next, final) => props => final({ ...props, className: arg1 }))
      case 'boolean': return this.use(type, next => props => null);
      case 'function': return this.use(type, next => arg1);
    }
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
    private slots: Record<string, Template> = {}
  ) {
    super();
  }

  static configure(name: string, options?: TemplateOptions) {
    const final = { ...defaultElements, ...options?.elements || {} };

    const slots = (options?.slots || []).reduce((slots, slot) => {
      slots[(slot as any).name] = slot;
      return slots;
    }, {} as Record<string, Template>);

    return new ImagoBuilder(name, final, {}, slots);
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

  static changeElement<T extends NodeProps>({ replace, ...matchOptions }: ChangeElementOptions<T>): ImagoMiddleware<T> {
    return next => ({ children, ...props }) => isMatching({ children, ...props } as any, matchOptions)
      ? React.createElement(replace, props as any, children)
      : next({ children, ...props } as any);
  }

  static Project({ slot, nodes, type, enumerate }: ProjectProps) {
    let children = nodes;

    if (type) {
      children = React.Children.toArray(nodes).filter(c => {
        const name = (c as any).type.displayName;
        return type.includes(name);
      });
    }

    return slot
      ? <TemplateContext.Provider value={slot}>{ children }</TemplateContext.Provider>
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
      const context = useContext(TemplateContext)

      if (context && context !== this.name) {
        if (this.slots[context] && this.slots[context] instanceof Imago) {
          return this.slots[context].resolve(node)(p);
        }
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
