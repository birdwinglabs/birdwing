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
  AbstractTemplateFactory,
  ComponentFactory,
  TOptions,
  TagHandler,
  ComponentMiddleware,
  NodeTreeContext,
  NodeContext,
  NodeInfo,
} from "./interfaces";
import { defaultElements } from "./Elements";
import { NodeTree } from "./types";
import { schema, Type } from "./schema";

export function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, ...sources: any[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

function makeRenderProps(props: NodeProps, nodes: Record<number, NodeInfo>) {
  return {
    ...props,
    Slot: makeSlot(props.children, nodes, props.k),
    properties: nodes[props.k].meta,
    node: new NodeContext(nodes, props.k),
  };
}


export function makeSlot(children: React.ReactNode, nodes: Record<number, NodeInfo>, key: number) {
  return ({ name, property }: any) => {
    if (name) {
      const refKey = nodes[key].refs[name];
      return refKey ? nodes[refKey].element: '';
    } else if (property) {
      const refKey = nodes[key].properties[property];
      return refKey ? nodes[refKey].element: '';
    } else {
      return children;
    }
  }
}

export function transform<T extends NodeType>(options: TOptions<T>): ImagoMiddleware<Element<T>> {
  const middleware = options.middleware;

  return (next, final) => (elem) => {
    const t = ({ name, props }: Element<T>) => {
      let pNext = props;

      if (options.class) {
        const addClass = Array.isArray(options.class) ? options.class.join(' ') : options.class;
        pNext = { ...pNext, className: [elem.props.className, addClass].join(' ') };
      }
      if (options.children) {
        pNext = { ...pNext, children: <>{ options.children({ ...pNext, Slot: makeSlot(pNext.children, {}, 0) })}</>}
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

      if (options.render) {
        return options.render({ ...pNext, Slot: makeSlot(pNext.children, {}, 0) });
      }

      return next({ name, props: pNext });
    }

    if (middleware) {
      return middleware(t, final)(elem);
    }

    return t(elem);
  }
}

function createDefaultHandler(): React.FunctionComponent<Element> {
  return ({ name, props }) => {
    const { index, isLast, k, children, ...restProps } = props;

    if (defaultElements[name]) {
      return defaultElements[name]({...restProps, children});
    } else {
      return React.createElement(name, restProps, children);
    }
  }
}

export class ImagoComponentFactory<T extends ComponentType<any>> extends ComponentFactory<T["tag"]> {
  private variants: Record<string, ImagoComponentOptions<T>> = {};

  constructor(
    public readonly tag: T["tag"],
    public readonly type: string,
    private options: ImagoComponentOptions<T>
  ) {
    super();
  }

  extend<U extends ComponentType<any>>(type: Type<U>, options: ImagoComponentOptions<T & U>): ImagoComponentFactory<U> {
    return createComponent(type, mergeDeep({}, this.options, options));
  }

  variant(name: string, options: ImagoComponentOptions<T>): this {
    this.variants[name] = options;
    return this;
  }

  applyMiddleware(parent: AbstractTemplateFactory): void {
    const template = this.template();
    parent.use(this.tag, next => props => {
      if (props.typeof === this.type) {
        return this.resolveInOther(this.tag, template, props);
      } else {
        return next(props);
      }
    }) 
  }

  private resolveInOther(tag: NodeType, template: AbstractTemplate, props: NodeProps) {
    return (
      <TemplateContext.Provider value={template}>
        { template.resolve(tag)(props) }
      </TemplateContext.Provider>
    )
  }

  private createPropertyHandler(property: TagHandler<NodeType>): React.FunctionComponent<Element> {
    const next = createDefaultHandler();
    const mw = tagHandlerToMiddleware(property);
    return (elem) => mw(next, next)(elem);
  }

  private createHandlers(options: ImagoComponentOptions<T>) {
    const handlers: Record<string, React.FunctionComponent<Element>> = {};

    // Components
    for (const c of options.components || []) {
      handlers[`typeof:${c.type}`] = ({ name, props }) => {
        const t = c.createTemplate(props['data-variant'] ? props['data-variant'].split(' ') : undefined);
        return this.resolveInOther(c.tag, t, props);
      }
    }

    // Middleware
    let middleware: ComponentMiddleware = {};
    for (const cmw of options.use || []) {
      for (const [t,mw] of Object.entries(cmw)) {
        if (middleware[t as NodeType]) {
          middleware[t as NodeType] = next => (mw as ImagoMiddleware<any>)(next as any, next)
        } else {
          middleware[t as NodeType] = mw as ImagoMiddleware<any>;
        }
      }
    }

    // Properties
    const properties = options.properties;

    if (properties) {
      for (const propName of Object.keys(properties)) {
        const p = properties[propName];
        handlers[`property:${propName}`] = p
          ? this.createPropertyHandler(p as any)
          : createDefaultHandler()
      }
    }

    // References
    const refs = options.refs;

    if (refs) {
      for (const refName of Object.keys(refs)) {
        const ref = refs[refName];
        handlers[`ref:${refName}`] = ref
          ? this.createPropertyHandler(ref as any)
          : createDefaultHandler()

        const next = handlers[`ref:${refName}`];

        handlers[`ref:${refName}`] = elem => {
          if (elem.name in middleware) {
            return (middleware[elem.name] as ImagoMiddleware)(next, next)(elem);
          }
          return next(elem);
        }
      }
    }

    for (const cmw of options.use || []) {
      for (const [t,mw] of Object.entries(cmw)) {
        if (!handlers[t]) {
          handlers[t] = createDefaultHandler();
        }
        const next = handlers[t];
        handlers[t] = (elem) => (mw as ImagoMiddleware<any>)(next, next)(elem);
      }
    }

    const tags = options.tags;
    if (tags) {
      for (const [t, handler] of Object.entries(tags)) {
        if (!handlers[t]) {
          handlers[t] = createDefaultHandler();
        }
        const next = handlers[t];
        const mw = tagHandlerToMiddleware<any>(handler);

        handlers[t] = (elem) => mw(next, next)(elem);
      }
    }

    const render = options.render;

    if (render) {
      handlers[this.handlerId] = ({ props }) => {
        return (
          <NodeTreeContext.Consumer>
            { nodes => render(makeRenderProps(props, nodes)) }
          </NodeTreeContext.Consumer>
        );
      }
    } else {
      handlers[this.handlerId] = createDefaultHandler();
    }

    const children = options.children;

    if (children) {
      const next = handlers[this.handlerId];
      handlers[this.handlerId] = ({ name, props }) => {
        return (
          <NodeTreeContext.Consumer>
            { nodes => next({ name, props: { ...props, children: children(makeRenderProps(props, nodes) as any)}})}
          </NodeTreeContext.Consumer>
        );
      }
    }

    const parent = options.parent;

    if (parent) {
      const next = handlers[this.handlerId];
      handlers[this.handlerId] = ({ name, props }) => {
        return React.createElement(parent, {} as any, next({ name, props }));
      }
    }

    if (options.childBefore) {
      const next = handlers[this.handlerId];
      handlers[this.handlerId] = ({ name, props }) => {
        return next({ name, props: {...props, children: <>{ options.childBefore } { props.children }</> }});
      }
    }
    if (options.childAfter) {
      const next = handlers[this.handlerId];
      handlers[this.handlerId] = ({ name, props }) => {
        return next({ name, props: {...props, children: <>{ props.children } { options.childAfter }</> }});
      }
    }

    const cls = options.class;

    if (cls) {
      const next = handlers[this.handlerId];
      handlers[this.handlerId] = ({ name, props }) => {
        if (typeof cls === 'string') {
          return next({ name, props: { ...props, className: options.class }});
        } else if (typeof cls === 'function') {
          return (
            <NodeTreeContext.Consumer>
              { nodes => next({ name, props: { ...props, className: cls(nodes[props.k].meta) }}) }
            </NodeTreeContext.Consumer>
          )
        }
      }
    }

    return handlers;
  }

  template(): AbstractTemplate {
    return new ImagoComponent(this.createHandlers(this.options));
  }

  createTemplate(variants: string[] = []) {
    const vOpts = variants
      .map(v => this.variants[v])
      .filter(opts => opts !== undefined);

    if (vOpts.length > 0) {
      return new ImagoComponent(this.createHandlers(mergeDeep({}, this.options, ...vOpts)));
    } else {
      return new ImagoComponent(this.createHandlers(this.options));
    }
  }

  private get handlerId() {
    return `typeof:${this.type}`;
  }
}

export class ImagoComponent extends AbstractTemplate {
  constructor(
    private handlers: Record<string, React.FunctionComponent<Element>> = {},
  ) {
    super();
  }

  resolve(name: NodeType): React.FunctionComponent<any> {
    return props => {
      const handlerName = () => {
        if (props.typeof && this.handlers[`typeof:${props.typeof}`]) {
          return `typeof:${props.typeof}`
        }
        if (props.property && this.handlers[`property:${props.property}`]) {
          return `property:${props.property}`
        }
        if (props['data-name'] && this.handlers[`ref:${props['data-name']}`]) {
          return `ref:${props['data-name']}`
        }
        return name;
      }

      if (name === 'document') {
        const nt = new NodeTree(schema);
        nt.process('document', props);
        console.log(nt.nodes);
        return (
          <NodeTreeContext.Provider value={nt.nodes}>
            { this.handlers[handlerName()]({ name, props: { ...props } }) }
          </NodeTreeContext.Provider>
        )
      }

      if (!this.handlers[handlerName()]) {
        return createDefaultHandler()({ name, props });
      }

      return this.handlers[handlerName()]({ name, props });
    }
  }
}

export function createComponent<T extends ComponentType<any>>(type: Type<T>, options: ImagoComponentOptions<T>) {
  return new ImagoComponentFactory(type.tag, type.name, options);
}

export function tagHandlerToMiddleware<T extends NodeType>(handler: TagHandler<T>): ImagoMiddleware<Element<T>> {
  return (next, final) => elem => {
    if (typeof handler === 'string') {
      return transform<T>({ class: handler })(next, final)(elem);
    } else if (typeof handler === 'function') {
      return (
        <NodeTreeContext.Consumer>
          { nodes => handler({...elem.props as any, Slot: makeSlot(elem.props.children, nodes, 0)}) }
        </NodeTreeContext.Consumer>
      );
    } else if (handler instanceof ComponentFactory) {
      const template = handler.template();
      return (
        <TemplateContext.Provider value={template}>
          { template.resolve(elem.name)(elem.props) }
        </TemplateContext.Provider>
      );
    } else if (typeof handler === 'object') {
      return transform(handler)(next, next)(elem);
    }
    return next(elem);
  }
}

export function select<T extends NodeType>(fn: (node: NodeContext) => TagHandler<T>): TOptions<T> {
  return {
    middleware: (next, final) => (elem) => {
      const nodes = useContext(NodeTreeContext);
      const node = new NodeContext(nodes, elem.props.k);

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