import React, { useContext } from "react";
import {
  AbstractTemplate,
  ImagoComponentOptions,
  ImagoMiddleware,
  NodeProps,
  NodeType,
  ComponentType,
  Element,
  TemplateContext,
  ComponentFactory,
  TOptions,
  TagHandler,
  ComponentMiddleware,
  NodeTreeContext,
  NodeContext,
  NodeInfo,
  TagProps,
  TransformOptions,
} from "./interfaces";
import { defaultElements } from "./Elements";
import { makeComponentSlot, makeNodeSlot, mergeDeep } from "./utils";
import { Type } from "./schema";

export function transformMiddleware<T extends NodeType, TSlot extends React.FunctionComponent<any>>(
  options: TransformOptions<T, TSlot>,
  slot: (props: TagProps<T>) => TSlot
) {
    const renderProps = (props: TagProps<T>) => {
      return { ...props, Slot: slot(props) };
    }

    const t: ImagoMiddleware<Element<T>> = next => ({ name, props }) => {
      let pNext = props;

      if (options.class) {
        const addClass = Array.isArray(options.class) ? options.class.join(' ') : options.class;
        pNext = { ...pNext, className: [props.className, addClass].join(' ') };
      }
      if (options.childBefore) {
        pNext = { ...pNext, children: <>{ options.childBefore } { pNext.children }</> }
      }
      if (options.childAfter) {
        pNext = { ...pNext, children: <>{ pNext.children } { options.childAfter }</> }
      }
      if (options.parent) {
        return React.createElement(options.parent, {} as any, next({ name, props: pNext }));
      }
      if (options.children) {
        pNext = { ...pNext, children: <>{ options.children(renderProps(pNext))}</>}
      }
      if (options.render) {
        return options.render(renderProps(pNext));
      }

      return next({ name, props: pNext });
    }

    return t;
}

export function transform<T extends NodeType>(options: TOptions<T>): ImagoMiddleware<Element<T>> {
  const middleware = options.middleware;
  const t = transformMiddleware(options, props => makeNodeSlot(props.children));

  return middleware
    ? (next, final) => elem => middleware(t(next, final), final)(elem)
    : t;
}

function createDefaultHandler(): React.FunctionComponent<Element> {
  return ({ name, props }) => {
    const { k, children, ...restProps } = props;

    return defaultElements[name]
      ? defaultElements[name]({...restProps, children})
      : React.createElement(name, restProps, children);
  }
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

  private resolveInOther(tag: NodeType, template: AbstractTemplate, props: NodeProps) {
    return (
      <TemplateContext.Provider value={template}>
        { template.resolve(tag)(props) }
      </TemplateContext.Provider>
    )
  }

  private createMiddleware(nodes: Record<number, NodeInfo>, options: ImagoComponentOptions<T>) {
    const middleware: Record<string, ImagoMiddleware<Element>> = {};

    // Components
    for (const c of options.components || []) {
      middleware[`typeof:${c.type}`] = next => ({ name, props }) => {
        return this.resolveInOther(c.tag, c.createTemplate(nodes, props), props);
      }
    }

    // Middleware
    let componentMiddleware: ComponentMiddleware = {};
    for (const cmw of options.use || []) {
      for (const [t,mw] of Object.entries(cmw)) {
        if (middleware[t as NodeType]) {
          componentMiddleware[t as NodeType] = next => (mw as ImagoMiddleware<any>)(next as any, next)
        } else {
          componentMiddleware[t as NodeType] = mw as ImagoMiddleware<any>;
        }
      }
    }

    // Properties
    const properties = options.properties;

    if (properties) {
      for (const propName of Object.keys(properties)) {
        const p = properties[propName];
        middleware[`property:${propName}`] = this.combineMiddleware(componentMiddleware, tagHandlerToMiddleware(p as any));
      }
    }

    // References
    const refs = options.refs;

    if (refs) {
      for (const refName of Object.keys(refs)) {
        const ref = refs[refName];
        middleware[`ref:${refName}`] = this.combineMiddleware(componentMiddleware, tagHandlerToMiddleware(ref as any));
      }
    }

    // Unspecified tags
    for (const [t, handler] of Object.entries(componentMiddleware)) {
      middleware[t] = handler;
    }

    // Tags
    const tags = options.tags;
    if (tags) {
      for (const [t, handler] of Object.entries(tags)) {
        middleware[t] = this.combineMiddleware(componentMiddleware, tagHandlerToMiddleware<any>(handler));
      }
    }

    middleware[`typeof:${this.type}`] = transformMiddleware(options, props =>
      makeComponentSlot(props.children, nodes, props.k)
    );

    return middleware;
  }

  private combineMiddleware(cmwm: ComponentMiddleware, mw: ImagoMiddleware<Element>): ImagoMiddleware<Element> {
    return (next, final) => elem => {
      if (elem.name in cmwm) {
        const cmw = cmwm[elem.name] as ImagoMiddleware<Element>;
        return mw(cmw(next, final), final)(elem);
      } else {
        return mw(next, final)(elem);
      }
    }
  }

  createTemplate(nodes: Record<number, NodeInfo>, props: TagProps<T["tag"]>) {
    const options = typeof this.options === 'function'
      ? this.options(new NodeContext(nodes, props))
      : this.options;

    return new ImagoComponent(this.createMiddleware(nodes, options));
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

export function tagHandlerToMiddleware<T extends NodeType>(
  handler: TagHandler<T>,
): ImagoMiddleware<Element<T>> {
  return (next, final) => elem => {
    if (typeof handler === 'string') {
      return transform<T>({ class: handler })(next, final)(elem);
    } else if (handler instanceof ComponentFactory) {
      const nodes = useContext(NodeTreeContext);
      const template = handler.createTemplate(nodes, elem.props);
      return (
        <TemplateContext.Provider value={template}>
          { template.resolve(elem.name)(elem.props) }
        </TemplateContext.Provider>
      );
    } else if (typeof handler === 'function') {
      return handler({...elem.props as any, Slot: makeNodeSlot(elem.props.children)});
    } else if (typeof handler === 'object') {
      return transform(handler)(next, next)(elem);
    }
    return next(elem);
  }
}

export function select<T extends NodeType>(fn: (node: NodeContext<any>) => TagHandler<T>): TOptions<T> {
  return {
    middleware: (next, final) => (elem) => {
      const nodes = useContext(NodeTreeContext);
      const node = new NodeContext(nodes, elem.props);

      const handler = fn(node);

      if (handler) {
        const mw = tagHandlerToMiddleware(handler);
        return mw(next, final)(elem);
      } else {
        return next(elem);
      }
    }
  }
}
