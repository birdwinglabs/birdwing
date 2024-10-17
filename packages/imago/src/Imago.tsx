import React, { createContext, useContext } from "react";
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
  TemplateConfig
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

export interface Imago {
  heading(render: ImagoHandler<HeadingProps> | false): Imago;
  heading(newClass: string | string[]): Imago;
  heading(match: HeadingFilter, render: ImagoRender<HeadingProps>): Imago;

  h1(newClass: string): Imago;
  h1(render: ImagoHandler<HeadingProps> | false): Imago;
  h1(match: HeadingFilter, render: ImagoRender<HeadingProps>): Imago;

  h2(newClass: string): Imago;
  h2(render: ImagoHandler<HeadingProps> | false): Imago;
  h2(match: HeadingFilter, render: ImagoRender<HeadingProps>): Imago;

  paragraph(render: ImagoHandler<ParagraphProps> | false): Imago;
  paragraph(newClass: string | string[]): Imago;
  paragraph(match: NodeFilter, render: ImagoRender<ParagraphProps>): Imago;

  list(render: ImagoHandler<ListProps> | false): Imago;
  list(newClass: string | string[]): Imago;
  list(match: NodeFilter, render: ImagoRender<ListProps>): Imago;

  item(render: ImagoHandler<ItemProps> | false): Imago;
  item(newClass: string | string[]): Imago;
  item(match: NodeFilter, render: ImagoRender<ItemProps>): Imago;

  fence(render: ImagoHandler<FenceProps> | false): Imago;
  fence(newClass: string | string[]): Imago;
  fence(match: NodeFilter, render: ImagoRender<FenceProps>): Imago;

  link(handler: ImagoHandler<LinkProps> | false): Imago;
  link(newClass: string | string[]): Imago;
  link(match: NodeFilter, render: ImagoRender<LinkProps>): Imago;

  use(type: 'heading', middleware: ImagoMiddleware<HeadingProps>): Imago;
  use(type: 'paragraph', middleware: ImagoMiddleware<ParagraphProps>): Imago;
  use(type: 'hr', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'image', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'fence', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'blockquote', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'list', middleware: ImagoMiddleware<ListProps>): Imago;
  use(type: 'item', middleware: ImagoMiddleware<ItemProps>): Imago;
  use(type: 'strong', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'link', middleware: ImagoMiddleware<NodeProps>): Imago;
  use(type: 'code', middleware: ImagoMiddleware<NodeProps>): Imago;
}


export class Imago extends Template {
  private final: Record<string, ImagoHandler>;

  constructor(
    public readonly name: string,
    private handlers: Record<string, ImagoHandler>,
    private slots: Record<string, Template> = {}
  ) {
    super();
    this.final = { ...handlers };
  }

  static configure(config: TemplateConfig<any>) {
    const elementsConfig = { ...defaultElements, ...config.elements };

    const handlers: Record<string, ImagoHandler> = {
      ...elementsConfig,
      layout: config.layout,
    }

    const slots = (config.slots || []).reduce((slots, slot) => {
      slots[(slot as any).name] = slot;
      return slots;
    }, {} as Record<string, Template>);

    return new Imago(config.name, handlers, slots);
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
      : children;
  }

  static createSlot(name: string) {
    const elementsConfig = { ...defaultElements };

    const handlers: Record<string, ImagoHandler> = {
      ...elementsConfig,
    }

    return new Imago(name, handlers, {});
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

  heading(arg1: HeadingFilter | ImagoRender<HeadingProps>, arg2?: ImagoRender<HeadingProps>) {
    return this.define('heading', arg1, arg2);
  }

  paragraph(arg1: ImagoRender<ParagraphProps> | NodeFilter, arg2?: ImagoRender<ParagraphProps>) {
    return this.define('paragraph', arg1, arg2);
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

  public use<T = any>(type: string, middleware: ImagoMiddleware<T>): this {
    const next = this.handlers[type];
    const final = this.final[type];

    this.handlers[type] = props => middleware(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)

    return this;
  }
}
