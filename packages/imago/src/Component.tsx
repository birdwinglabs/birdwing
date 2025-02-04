import React from "react";
import {
  AbstractTemplate,
  ImagoComponentOptions,
  ImagoMiddleware,
  NodeType,
  ComponentType,
  Element,
  ComponentFactory,
  ComponentMiddleware,
  NodeContext,
  NodeInfo,
  TagProps,
  TagHandler,
} from "./interfaces";
import { defaultElements } from "./Elements";
import { makeComponentSlot, mergeDeep } from "./utils";
import { Type } from "./schema";
import { ComponentMiddlewareFactory, createMiddlewareFactory } from "./middeware";
import { TransformMiddlewareFactory } from "./middeware/transform";


function createDefaultHandler(): React.FunctionComponent<Element> {
  return ({ name, props }) => {
    const { k, children, ...restProps } = props;

    return defaultElements[name]
      ? defaultElements[name]({...restProps, children})
      : React.createElement(name, restProps, children);
  }
}

function chain<T extends NodeType>(mw1: ImagoMiddleware<Element<T>>, mw2: ImagoMiddleware<Element<T>>): ImagoMiddleware<Element<T>> {
  return (next, final) => mw1(mw2(next, final), final);
}

export class ImagoComponentFactory<T extends ComponentType<any>> extends ComponentFactory<T["tag"]> {
  constructor(
    public readonly tag: T["tag"],
    public readonly type: string,
    private options: ImagoComponentOptions<T> | ((meta: T["schema"]) => ImagoComponentOptions<T>)
  ) {
    super();
  }

  extend<U extends ComponentType<any>>(type: Type<U>, options: ImagoComponentOptions<T & U>): ImagoComponentFactory<U> {
    return createComponent(type, mergeDeep({}, this.options, options));
  }

  createTemplate(nodes: Record<number, NodeInfo>, props: TagProps<T["tag"]>) {
    const options = typeof this.options === 'function'
      ? this.options(new NodeContext(nodes, props))
      : this.options;

    return new ImagoComponent(this.createMiddleware(nodes, options));
  }

  private createMiddleware(nodes: Record<number, NodeInfo>, options: ImagoComponentOptions<T>) {
    const middleware: Record<string, ImagoMiddleware<Element>> = {};

    // Components
    for (const c of options.components || []) {
      const fact = new ComponentMiddlewareFactory(c);
      middleware[`typeof:${c.type}`] = fact.createMiddleware(nodes);
    }

    // Middleware
    let componentMiddleware: ComponentMiddleware = {};
    for (const cmw of options.use || []) {
      for (const [t,mw] of Object.entries(cmw)) {
        if (componentMiddleware[t as NodeType]) {
          componentMiddleware[t as NodeType] = chain<any>(componentMiddleware[t as NodeType] as ImagoMiddleware<Element>, mw)//next => (mw as ImagoMiddleware<any>)(next as any, next)
        } else {
          componentMiddleware[t as NodeType] = mw as ImagoMiddleware<any>;
        }
      }
    }

    // Properties
    for (const [propName, prop] of Object.entries(options.properties || {})) {
      middleware[`property:${propName}`] = this.createNodeMiddleware(prop, componentMiddleware, nodes);
    }

    // References
    for (const [refName, ref] of Object.entries(options.refs || {})) {
      middleware[`ref:${refName}`] = this.createNodeMiddleware(ref, componentMiddleware, nodes);
    }

    // Unspecified tags
    for (const [t, handler] of Object.entries(componentMiddleware)) {
      middleware[t] = handler;
    }

    // Tags
    for (const [tagName, tag] of Object.entries(options.tags || {})) {
      middleware[tagName] = this.createNodeMiddleware(tag, componentMiddleware, nodes);
    }

    const fact = new TransformMiddlewareFactory(options, props => makeComponentSlot(props.children, nodes, props.k));

    middleware[`typeof:${this.type}`] = fact.createMiddleware(nodes);

    return middleware;
  }

  private createNodeMiddleware(handler: TagHandler<any>, cmwm: ComponentMiddleware, nodes: Record<number, NodeInfo>) {
    const mw = createMiddlewareFactory(handler).createMiddleware(nodes);
    return this.combineMiddleware(cmwm, mw);
  }

  private combineMiddleware(cmwm: ComponentMiddleware, mw: ImagoMiddleware<Element>): ImagoMiddleware<Element> {
    return (next, final) => elem => {
      if (elem.name in cmwm) {
        const cmw = cmwm[elem.name] as ImagoMiddleware<Element>;
        return chain(mw, cmw)(next, final)(elem);
      } else {
        return mw(next, final)(elem);
      }
    }
  }
}

export class ImagoComponent extends AbstractTemplate {
  constructor(
    private middleware: Record<string, ImagoMiddleware<Element>> = {},
  ) {
    super();
  }

  resolve(name: NodeType): React.FunctionComponent<any> {
    const fallback = createDefaultHandler();

    return props => {
      const handlerName = () => {
        if (props.typeof && this.middleware[`typeof:${props.typeof}`]) {
          return `typeof:${props.typeof}`
        }
        if (props.property && this.middleware[`property:${props.property}`]) {
          return `property:${props.property}`
        }
        if (props['data-name'] && this.middleware[`ref:${props['data-name']}`]) {
          return `ref:${props['data-name']}`
        }
        return name;
      }

      const hName = handlerName();

      if (!this.middleware[hName]) {
        return fallback({ name, props });
      }

      return this.middleware[hName](fallback, fallback)({ name, props });
    }
  }
}

export function createComponent<T extends ComponentType<any>>(
  type: Type<T>,
  options: ImagoComponentOptions<T> | ((args: NodeContext<T>) => ImagoComponentOptions<T>)
) {
  return new ImagoComponentFactory(type.tag, type.name, options);
}
