import React from "react";
import {
  AbstractTemplate,
  ImagoComponentOptions,
  ImagoMiddleware,
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
import { Type, ComponentType, NodeType } from "@birdwing/renderable";
import { ComponentMiddlewareFactory, createMiddlewareFactory } from "./middeware";
import { TransformMiddlewareFactory } from "./middeware/transform";

function createDefaultHandler(context: Record<string, string>): React.FunctionComponent<Element> {
  const applyContext = (name: string) => {
    const translation = context[name];

    if (!translation) {
      return undefined;
    }

    if (translation.includes(':')) {
      const [ns, localName] = translation.split(':');
      return context[ns] + localName;
    }
    return translation;
  }

  return ({ name, props }) => {
    const { k, children, ...restProps } = props;

    restProps.property = restProps.property ? applyContext(restProps.property) : undefined;
    restProps.typeof = restProps.typeof ? applyContext(restProps.typeof) : undefined;

    return defaultElements[name]
      ? defaultElements[name]({...restProps, children})
      : React.createElement(name, restProps, children);
  }
}

function chain<T extends NodeType>(mw1: ImagoMiddleware<Element<T>>, mw2: ImagoMiddleware<Element<T>>): ImagoMiddleware<Element<T>> {
  return (next, final) => mw1(mw2(next, final), final);
}

type ImagoComponentOptionsFactory<T extends ComponentType<any>> = (node: NodeContext<T["schema"]>) => ImagoComponentOptions<T>;

export class ImagoComponentFactory<T extends ComponentType<object>> extends ComponentFactory<T["tag"]> {
  private components: ComponentFactory<any>[] = [];

  constructor(
    public readonly type: string,
    private context: Record<string, string>,
    private options: ImagoComponentOptions<T> | ImagoComponentOptionsFactory<T>,
    private base: ImagoComponentFactory<T> | undefined = undefined,
  ) {
    super();
  }

  extend<U extends T>(
    type: Type<U>,
    options: ImagoComponentOptions<U> | ImagoComponentOptionsFactory<U>
  ): ImagoComponentFactory<U> {
    return new ImagoComponentFactory(type.name, type.context, options, this);
  }

  createTemplate(nodes: Record<number, NodeInfo>, props: TagProps<T["tag"]>, parentContext: Record<string, string> = {}) {
    return new ImagoComponent(this.type, this.createMiddleware(nodes, this.createOptions(nodes, props)), this.context, parentContext);
  }

  useComponent<C extends ComponentType<object>>(fact: ImagoComponentFactory<C>): this;
  useComponent<C extends ComponentType<object>>(type: Type<C>, options: ImagoComponentOptions<C> | ImagoComponentOptionsFactory<C>): this;
  useComponent<C extends ComponentType<object>>(typeOrFact: Type<C> | ImagoComponentFactory<C>, options?: ImagoComponentOptions<C> | ImagoComponentOptionsFactory<C>) {
    if (typeOrFact instanceof ImagoComponentFactory) {
      this.components.push(typeOrFact);
    } else if (options) {
      this.components.push(createComponent(typeOrFact, options));
    }
    return this;
  }

  component<C extends ComponentType<object>>(type: Type<C>): ImagoComponentFactory<C> {
    let c = this.components.find(c => c.type === type.name) as ImagoComponentFactory<C> | undefined;

    if (!c) {
      c = createComponent(type, {});
      this.components.push(c);
    }
    return c;
  }

  private createOptions(nodes: Record<number, NodeInfo>, props: TagProps<T["tag"]>): ImagoComponentOptions<T> {
    const options = typeof this.options === 'function'
      ? this.options(new NodeContext(nodes, props))
      : this.options;

    return this.base
      ? mergeDeep({}, this.base.createOptions(nodes, props), options)
      : options;
  }

  private createMiddleware(nodes: Record<number, NodeInfo>, options: ImagoComponentOptions<T>) {
    const middleware: Record<string, ImagoMiddleware<Element>> = {};

    // Components
    for (const c of this.components) {
      const fact = new ComponentMiddlewareFactory(c, this.context);
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
      middleware[`property:${propName}`] = this.createNodeMiddleware(prop as any, componentMiddleware, nodes);
    }

    // References
    for (const [refName, ref] of Object.entries(options.refs || {})) {
      middleware[`ref:${refName}`] = this.createNodeMiddleware(ref as any, componentMiddleware, nodes);
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

  private createNodeMiddleware(handler: TagHandler<any, any>, cmwm: ComponentMiddleware, nodes: Record<number, NodeInfo>) {
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
    private type: string,
    private middleware: Record<string, ImagoMiddleware<Element>> = {},
    private context: Record<string, string>,
    private parentContext: Record<string, string> = {},
  ) {
    super();
  }

  resolve(name: NodeType): React.FunctionComponent<any> {
    return props => {
      const handlerName = () => {
        const property = props.property;

        if (props.typeof && this.middleware[`typeof:${props.typeof}`]) {
          return `typeof:${props.typeof}`
        }
        if (property && this.middleware[`property:${property}`]) {
          return `property:${property}`
        }
        if (props['data-name'] && this.middleware[`ref:${props['data-name']}`]) {
          return `ref:${props['data-name']}`
        }
        return name;
      }

      const hName = handlerName();

      const context = hName === `typeof:${this.type}` && props.property
        ? { ...this.context, [props.property]: this.parentContext[props.property] }
        : this.context;

      const fallback = createDefaultHandler(context);

      if (!this.middleware[hName]) {
        return fallback({ name, props });
      }

      return this.middleware[hName](fallback, fallback)({ name, props });
    }
  }
}

export function createComponent<T extends ComponentType<object>>(
  type: Type<T>,
  options: ImagoComponentOptions<T> | ImagoComponentOptionsFactory<T>
) {
  return new ImagoComponentFactory(type.name, type.context, options);
}
