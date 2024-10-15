import React, { createContext, useContext } from "react";
import { Template } from '@birdwing/react';
import { HeadingProps, NodeConfig, ParagraphProps, TemplateConfig } from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { configureNode, makeElementFactory } from "./factory.js";

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

//export interface ImagoContext<T> {
  //props: T,
  //children: any;
//}

export type ImagoHandler<T = any> = React.FunctionComponent<T>;
//export type ImagoHandler<T = any> = (context: ImagoContext<T>) => React.ReactElement | null;
export type ImagoMiddleware<T = any> = (next: ImagoHandler<T> | (() => React.ReactElement | null), final: ImagoHandler<T>) => ImagoHandler<T>;

export interface Imago {
  heading(middleware: ImagoMiddleware): Imago;
  heading(newClass: string): Imago;
  heading(match: string, render: ImagoHandler<HeadingProps>): Imago;
  heading(match: string, newClass: string): Imago;

  paragraph(middleware: ImagoMiddleware): Imago;
  paragraph(newClass: string): Imago;
  paragraph(match: string, render: ImagoHandler<HeadingProps>): Imago;
  paragraph(match: string, newClass: string): Imago;
}

export interface ProjectProps {
  slot?: string;

  type?: string[];

  nodes: React.ReactNode[];

  enumerate?: boolean;
}

export class Imago extends Template {
  private final: Record<string, ImagoHandler> = {
    'heading': ({ level, children, ...props }: HeadingProps) => React.createElement(`h${level}`, props, children),
    'paragraph': ({ children, ...props }: ParagraphProps) => React.createElement('p', props, children),
  }
  private handlers: Record<string, ImagoHandler> = { ...this.final };

  constructor(
    public readonly name: string,
    private layout: React.FunctionComponent<any>,
    private children: Nodes,
    private slots: Slots,
    private fallback: (node: string) => React.FunctionComponent<any>,
  ) { super(); }

  static configure(config: TemplateConfig<any>) {
    const elementsConfig = { ...defaultElements, ...config.elements };

    const makeNode = (name: string, config: NodeConfig<any>) => {
      const fact = makeElementFactory(elementsConfig, name);
      return configureNode(fact, config);
    }

    const layout: React.FunctionComponent<any> = makeNode('layout', config.layout);
    const children: Record<string, React.FunctionComponent<any>> = {};
    const slots: Record<string, Record<string, React.FunctionComponent<any>>> = {};

    for (const [name, nodeConfig] of Object.entries(config.children || {})) {
      children[name] = makeNode(name, nodeConfig);
    }
    for (const [slotName, slotConfig] of Object.entries(config.slots || {})) {
      slots[slotName] = {};
      for (const [name, nodeConfig] of Object.entries(slotConfig || {})) {
        slots[slotName][name] = makeNode(name, nodeConfig);
      }
    }

    return new Imago(config.name, layout, children, slots, node => makeElementFactory(elementsConfig, node));
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

  static createSlot(name: string) {
    return new Imago(name, () => null, {}, {}, () => () => null);
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

  resolve(node: string, slot?: string) {
    if (node === 'layout') {
      return (props: any) => (
        <TemplateContext.Provider value={undefined}>
          { this.layout(props) }
        </TemplateContext.Provider>
      );
    }

    const Component: React.FunctionComponent = (p: any) => {
      const context = useContext(TemplateContext) || slot;

      if (context) {
        if (this.slots[context] && this.slots[context][node]) {
          return this.slots[context][node](p);
        }
      } else {
        const handler = this.handlers[node];

        if (handler) {
          return handler(p)
        }
        if (this.children[node]) {
          return this.children[node](p);
        }

      }
      return this.fallback(node)(p);
    }

    Component.displayName = node;
    return Component;
  }

  heading(arg1: ImagoMiddleware<HeadingProps> | string, arg2?: ImagoHandler<HeadingProps> | string) {
    return this.define('heading', arg1, arg2);
  }

  paragraph(arg1: ImagoMiddleware<HeadingProps> | string, arg2?: ImagoHandler<HeadingProps> | string) {
    return this.define('paragraph', arg1, arg2);
  }

  private define(type: string, arg1: ImagoMiddleware<any> | string, arg2?: ImagoHandler<any> | string): this {
    const matcher = (pattern: string) => {
      switch (pattern) {
        case 'h1': return (props: any) => props.level === 1;
        case 'h2': return (props: any) => props.level === 2;
        case 'h3': return (props: any) => props.level === 3;
        case 'h4': return (props: any) => props.level === 4;
        case 'h5': return (props: any) => props.level === 5;
        case 'h6': return (props: any) => props.level === 6;
      }
      return (props: any) => false;
    }

    // Set class
    if (typeof arg1 === 'string') {
      switch (typeof arg2) {
        case 'string':
          return this.use(type, (next, final) => props => matcher(arg1)(props) ? final({ ...props, className: arg2 }) : next(props))
        case 'function':
          return this.use(type, next => props => matcher(arg1)(props) ? arg2(props) : next(props))
        case 'undefined':
          return this.use(type, next => props => next({ ...props, className: arg1}));
      }
    }

    return this.use(type, arg1);
  }

  private use(type: string, middleware: ImagoMiddleware<any>): this {
    const next = this.handlers[type];
    const final = this.final[type];

    this.handlers[type] = props => middleware(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)

    return this;
  }
}
