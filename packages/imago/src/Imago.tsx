import React, { createContext, useContext } from "react";
import { Template } from '@birdwing/react';
import { HeadingProps, ImagoHandler, ImagoMiddleware, ItemProps, ListProps, NodeConfig, NodeProps, ParagraphProps, TemplateConfig, TemplateNodeConfig } from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { configureNode, makeElementFactory } from "./factory.js";
import { LinkProps } from "react-router-dom";

const TemplateContext = createContext<string | undefined>(undefined);

type Nodes = Record<string, React.FunctionComponent<any>>;
type Slots = Record<string, Nodes>;

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

export interface Imago {
  heading(middleware: ImagoMiddleware<HeadingProps>): Imago;
  heading(newClass: string): Imago;
  heading(match: HeadingFilter, render: ImagoHandler<HeadingProps> | string | false): Imago;

  h1(newClass: string): Imago;
  h1(render: ImagoHandler<HeadingProps> | false): Imago;
  h1(match: HeadingFilter, render: ImagoHandler<HeadingProps> | string | false): Imago;

  h2(newClass: string): Imago;
  h2(render: ImagoHandler<HeadingProps> | false): Imago;
  h2(match: HeadingFilter, render: ImagoHandler<HeadingProps> | string | false): Imago;

  paragraph(middleware: ImagoMiddleware<ParagraphProps>): Imago;
  paragraph(newClass: string): Imago;
  paragraph(match: NodeFilter, render: ImagoHandler<ParagraphProps> | string | false): Imago;

  list(middleware: ImagoMiddleware<ListProps>): Imago;
  list(newClass: string): Imago;
  list(match: NodeFilter, render: ImagoHandler<ListProps> | string | false): Imago;

  item(middleware: ImagoMiddleware<ItemProps>): Imago;
  item(newClass: string): Imago;
  item(match: NodeFilter, render: ImagoHandler<ItemProps> | string | false): Imago;

  link(middleware: ImagoMiddleware<LinkProps>): Imago;
  link(newClass: string): Imago;
  link(match: NodeFilter, render: ImagoHandler<LinkProps> | string | false): Imago;
}

export interface ProjectProps {
  slot?: string;

  type?: string[];

  nodes: React.ReactNode[];

  enumerate?: boolean;
}

abstract class Matcher<T = any> {
  abstract test(props: T): boolean;
}

class NodeMatcher<TProps extends { className?: string } = any> extends Matcher<TProps> {
  constructor(protected tests: ((props: TProps) => boolean)[]) { super(); }

  test(props: TProps): boolean {
    return this.tests.every(t => t(props));
  }

  static fromNodeFilter(f: NodeFilter) {
    return new NodeMatcher([
      props => f.className ? f.className === props.className : true,
    ])
  }

  static fromHeadingFilter(f: HeadingFilter) {
    return new NodeMatcher([
      props => f.level ? f.level === props.level : true,
      props => f.className ? f.className === props.className : true,
    ])
  }
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

    const makeNode = (name: string, config: NodeConfig<any>) => {
      const fact = makeElementFactory(elementsConfig, name);
      return configureNode(fact, config);
    }

    const handlers: Record<string, ImagoHandler> = {
      ...elementsConfig,
      layout: makeNode('layout', config.layout),
    }

    for (const [name, nodeConfig] of Object.entries(config.children || {})) {
      handlers[name] = makeNode(name, nodeConfig);
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

  static slot(name: string, children: React.ReactNode[], options: SlotOptions = {}) {
    let nodes = children;

    const opts = Object.assign({ filter: {}}, options);

    if (options.filter) {
      nodes = React.Children.toArray(nodes).filter(c => {
        const name = (c as any).type.displayName;
        return name in opts.filter;
      });
    }

    return <TemplateContext.Provider value={name}>{ nodes }</TemplateContext.Provider>;
  }

  static createSlot(name: string, children: TemplateNodeConfig) {
    const elementsConfig = { ...defaultElements };

    const makeNode = (name: string, config: NodeConfig<any>) => {
      const fact = makeElementFactory(elementsConfig, name);
      return configureNode(fact, config);
    }

    const handlers: Record<string, ImagoHandler> = {
      ...elementsConfig,
    }

    for (const [name, nodeConfig] of Object.entries(children || {})) {
      handlers[name] = makeNode(name, nodeConfig);
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

  h1(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(1, arg1, arg2);
  }
  h2(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(2, arg1, arg2);
  }
  h3(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(3, arg1, arg2);
  }
  h4(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(4, arg1, arg2);
  }
  h5(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(5, arg1, arg2);
  }
  h6(arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.h(6, arg1, arg2);
  }

  private h(level: number, arg1: NodeFilter | ImagoHandler<HeadingProps> | string | false, arg2?: ImagoHandler<HeadingProps> | string | false) {
    const matcher = NodeMatcher.fromHeadingFilter(typeof arg1 === 'object' ? { ...arg1, level } : { level });

    return this.match('heading', matcher, typeof arg1 === 'object' ? arg2 || false : arg1);
  }

  heading(arg1: ImagoMiddleware<HeadingProps> | HeadingFilter | string, arg2?: ImagoHandler<HeadingProps> | string | false) {
    return this.define('heading', typeof arg1 === 'object' ? NodeMatcher.fromHeadingFilter(arg1) : arg1, arg2);
  }

  paragraph(arg1: ImagoMiddleware<ParagraphProps> | NodeFilter | string, arg2?: ImagoHandler<ParagraphProps> | string | false) {
    return this.define('paragraph', typeof arg1 === 'object' ? NodeMatcher.fromNodeFilter(arg1) : arg1, arg2);
  }

  list(arg1: ImagoMiddleware<ListProps> | NodeFilter | string, arg2?: ImagoHandler<ListProps> | string | false) {
    return this.define('list', typeof arg1 === 'object' ? NodeMatcher.fromNodeFilter(arg1) : arg1, arg2);
  }

  item(arg1: ImagoMiddleware<ItemProps> | NodeFilter | string, arg2?: ImagoHandler<ItemProps> | string | false) {
    return this.define('item', typeof arg1 === 'object' ? NodeMatcher.fromNodeFilter(arg1) : arg1, arg2);
  }

  link(arg1: ImagoMiddleware<LinkProps> | NodeFilter | string, arg2?: ImagoHandler<LinkProps> | string | false) {
    return this.define('link', typeof arg1 === 'object' ? NodeMatcher.fromNodeFilter(arg1) : arg1, arg2);
  }

  private match(type: string, matcher: Matcher, render: ImagoHandler | string | boolean): this {
    switch (typeof render) {
      case 'boolean':
        return this.use(type, next => props => matcher.test(props) ? null : next(props));
      case 'string':
        return this.use(type, (next, final) => props => matcher.test(props) ? final({ ...props, className: render }) : next(props))
      case 'function':
        return this.use(type, next => props => matcher.test(props) ? render(props) : next(props))
    }
  }

  private define(type: string, arg1: ImagoMiddleware<any> | Matcher | string, arg2?: ImagoHandler<any> | string | boolean): this {
    if (typeof arg1 === 'object') {
      return this.match(type, arg1, arg2 || false);
    }

    if (typeof arg1 === 'string') {
      return this.use(type, (next, final) => props => final({ ...props, className: arg1 }));
    }

    return this.use(type, arg1);
  }

  private use<T = any>(type: string, middleware: ImagoMiddleware<T>): this {
    const next = this.handlers[type];
    const final = this.final[type];

    this.handlers[type] = props => middleware(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)

    return this;
  }
}
