import React, { createContext, useContext } from "react";
import { Link, NavLink } from 'react-router-dom';
import { HeadingProps, NodeConfig, RenderFunction, TemplateConfig } from "./interfaces.js";

const TemplateContext = createContext<string | undefined>(undefined);

export abstract class Middleware<T = any> {
  abstract apply(props: T, next: RenderFunction<any>): React.ReactNode;
}

export type MatchCase<T> = [any, NodeConfig<T>]
export type MatchPropCase<T> = [any, NodeConfig<T>]

export class MatchMiddleware<T> extends Middleware<T> {
  constructor(private cases: MatchCase<T>[]) { super(); }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    for (const c of this.cases) {
      const match = c[0];
      const config = c[1];

      if (Object.entries(match).every(([key, value]) => props[key] === value)) {
        switch (typeof config) {
          case 'string':
            return next({...props, className: config});
          case 'function':
            return config(props);
          case 'boolean':
            if (config === false) {
              return '';
            }
          case 'object':
            if (config instanceof Middleware)  {
              console.log(props);
              return config.apply(props, next);
            }
          default:
            return next(props);
        }
      }
    }
    return '';
  }
}

export class ReplaceTagMiddleware extends Middleware {
  constructor(private type: any, private props: any = {}) {
    super();
  }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    return React.createElement(this.type, this.props, props.children);
  }
}

export class ReplaceProps extends Middleware {
  constructor(private replace: (props: any) => any) {
    super();
  }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    return next(this.replace(props));
  }
}

export class AssignProps<T> extends Middleware<T> {
  constructor(private assign: (props: T) => any) {
    super();
  }

  apply(props: T, next: RenderFunction<any>): React.ReactNode {
    return next({ ...props, ...this.assign(props) });
  }
}

export function match<T = any>(cases: MatchCase<T>[]) {
  return new MatchMiddleware(cases);
}

export function matchProp<T = any>(prop: keyof T, cases: MatchPropCase<T>[]) {
  return new MatchMiddleware<T>(cases.map(c => [{ [prop]: c[0] }, c[1]]));
}

export function replaceWith(type: any, props?: any) {
  return new ReplaceTagMiddleware(type, props);
}

export function replaceProps(props: Record<string, any> | ((props: any) => any)) {
  return new ReplaceProps(typeof props === 'object' ? () => props : props);
}

export function assignProps<T>(props: Record<string, any> | ((props: T) => any)) {
  return new AssignProps<T>(typeof props === 'object' ? () => props : props);
}


type Nodes = Record<string, RenderFunction<any>>;
type Slots = Record<string, Nodes>;

const defaultElements: Record<string, string | RenderFunction<any>> = {
  layout: 'div',
  paragraph: 'p',
  item: 'li',
  list({ children, ordered, ...props }) {
    return ordered
      ? <ol {...props}>{ children }</ol>
      : <ul {...props}>{ children }</ul>;
  },
  heading({ children, level, ...props }: HeadingProps) {
    return React.createElement(`h${level}`, props, children);
  },
  link({ href, children, nav, ...props }) {
    return nav === true
      ? <NavLink to={href} {...props}>{ children }</NavLink>
      : <Link to={href} {...props}>{ children }</Link>;
  }
}

function nodeFactory(elements: Record<string, string | RenderFunction<any> | any>, name: string): RenderFunction<any> {
  const fact = elements[name];

  switch (typeof fact) {
    case 'string':
      return ({ children, ...props }: any) => React.createElement(fact, props, children);
    case 'object':
      return (props) => fact.render(props);
    case 'function':
      return fact;
    default:
      return ({ children, ...props }: any) => React.createElement(name, props, children);
  }
}


export class Template {
  constructor(
    public readonly name: string,
    private layout: RenderFunction<any>,
    private children: Nodes,
    private slots: Slots,
    private fallback: (node: string) => RenderFunction<any>,
  ) {}

  static configure(config: TemplateConfig<any>) {
    const elementsConfig = { ...defaultElements, ...config.elements };

    const makeNode = (name: string, config: any) => {
      switch (typeof config) {
        case 'string':
          return (props: any) => nodeFactory(elementsConfig, name)({ ...props, className: config });
        case 'function':
          return config;
        case 'object':
          if (config instanceof Middleware)  {
            return (props: any) => config.apply(props, nodeFactory(elementsConfig, name));
          }
        case 'undefined':
          return nodeFactory(elementsConfig, name);
      }
    }

    const layout: RenderFunction<any> = makeNode('layout', config.layout);
    const children: Record<string, RenderFunction<any>> = {};
    const slots: Record<string, Record<string, RenderFunction<any>>> = {};

    for (const [name, nodeConfig] of Object.entries(config.children || {})) {
      children[name] = makeNode(name, nodeConfig);
    }
    for (const [slotName, slotConfig] of Object.entries(config.slots || {})) {
      slots[slotName] = {};
      for (const [name, nodeConfig] of Object.entries(slotConfig || {})) {
        slots[slotName][name] = makeNode(name, nodeConfig);
      }
    }

    return new Template(config.name, layout, children, slots, node => nodeFactory(elementsConfig, node));
  }

  static slot(name: string, children: React.ReactNode[]) {
    return <TemplateContext.Provider value={name}>{ children }</TemplateContext.Provider>;
  }

  resolve(node: string, slot?: string) {
    if (node === 'layout') {
      return (props: any) => (
        <TemplateContext.Provider value={undefined}>
          { this.layout(props) }
        </TemplateContext.Provider>
      );
    }

    return (props: any) => {
      const context = useContext(TemplateContext) || slot;

      if (context) {
        if (this.slots[context] && this.slots[context][node]) {
          return this.slots[context][node](props);
        }
      } else {
        if (this.children[node]) {
          return this.children[node](props);
        }
      }
      return this.fallback(node)(props);
    }
  }
}
