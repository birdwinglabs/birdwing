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
  ItemTemplateOptions,
  NodeTreeContext,
  NodeContext,
  NodeInfo,
} from "./interfaces";
import { defaultElements } from "./Elements";
import { NodeTree, TypeContext, TypeMap } from "./types";
import { schema, Type } from "./schema";

function makeRenderProps(props: NodeProps, typeMap: TypeMap, nodes: Record<number, NodeInfo>) {
  return {
    ...props,
    Slot: makeSlot(props.children),
    properties: typeMap.get(props.k),
    node: new NodeContext(nodes, props.k),
  };
}


export function makeSlot(children: React.ReactNode) {
  return ({ name, property }: any) => {
    if (name) {
      return React.Children.toArray(children).filter(c => {
        return React.isValidElement(c) && c.props['data-name'] === name;
      });
    } else if (property) {
      // TODO: Deep properties;
      const res = React.Children.toArray(children).filter(c => {
        return React.isValidElement(c) && c.props.property === property;
      });
      return res;
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
        pNext = { ...pNext, children: <>{ options.children({ ...pNext, Slot: makeSlot(pNext.children) })}</>}
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
        return options.render({ ...pNext, Slot: makeSlot(pNext.children) });
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
  constructor(
    public readonly tag: T["tag"],
    public readonly type: string,
    private options: ImagoComponentOptions<T>
  ) {
    super();
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

  template(): AbstractTemplate {
    const options = this.options;
    const handlers: Record<string, React.FunctionComponent<Element>> = {};

    // Components
    for (const c of options.components || []) {
      const t = c.template();
      handlers[`typeof:${c.type}`] = ({ name, props }) => this.resolveInOther(c.tag, t, props);
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
          <TypeContext.Consumer>
            { typeMap => 
              <NodeTreeContext.Consumer>
                { nodes => render(makeRenderProps(props, typeMap, nodes)) }
              </NodeTreeContext.Consumer>
            }
          </TypeContext.Consumer>
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
          <TypeContext.Consumer>
            { typeMap => 
              <NodeTreeContext.Consumer>
                { nodes => next({ name, props: { ...props, children: children(makeRenderProps(props, typeMap, nodes) as any)}})}
              </NodeTreeContext.Consumer>
            }
          </TypeContext.Consumer>
        );
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
            <TypeContext.Consumer>
              { value => next({ name, props: { ...props, className: cls(value.types.get(props.k)) }}) }
            </TypeContext.Consumer>
          )
        }
      }
    }

    return new ImagoComponent(handlers);
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
        const tm = new TypeMap(schema);
        const nt = new NodeTree();
        nt.process('document', props);
        //console.log(nt.nodes);
        tm.parse(props);
        return (
          <TypeContext.Provider value={tm}>
            <NodeTreeContext.Provider value={nt.nodes}>
              { this.handlers[handlerName()]({ name, props: { ...props } }) }
            </NodeTreeContext.Provider>
          </TypeContext.Provider>
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
      return handler({...elem.props as any, Slot: makeSlot(elem.props.children)});
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

export function item(options: Partial<ItemTemplateOptions>): TOptions<'li'> {
  return {
    middleware: (next, final) => (elem) => {
      let handler = options.default;

      if (elem.props.index === 0 && options.first) {
        handler = options.first;
      } else if (elem.props.isLast && options.last) {
        handler = options.last;
      }

      if (handler) {
        const mw = tagHandlerToMiddleware(handler);
        return mw(next, final)(elem);
      } else {
        return next(elem);
      }
    }
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