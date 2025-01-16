import React from "react";
import { AbstractTemplate, ImagoComponentOptions, ImagoMiddleware, NodeProps, NodeType, PropertyTypes, ComponentType, Element, TagProps, TemplateContext, TypeSelector, AbstractTemplateFactory, SlotOptions, ComponentFactory, TOptions, HeadingTemplateOptions, TagHandler } from "./interfaces";
import { defaultElements } from "./Elements";
import { SlotProps } from "./Imago";

function getProperty(children: React.ReactNode, name: string) {
  for (const c of React.Children.toArray(children)) {
    if (React.isValidElement(c) && c.props.property === name) {
      const type = (c.type as any).displayName;
      switch (type) {
        case 'link': return c.props.href;
        case 'section': return null;
        default:
          throw Error(`Unknown node type: ${type}`);
      }
    }
  }
  return undefined;
}

export function makeSlot(children: React.ReactNode) {
  return ({ name, property }: any) => {
    if (name) {
      return React.Children.toArray(children).filter(c => {
        return React.isValidElement(c) && c.props.name === name;
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
        pNext = { ...pNext, className: Array.isArray(options.class) ? options.class.join(' ') : options.class };
      }
      if (options.childBefore) {
        pNext = { ...pNext, children: <>{ options.childBefore } { pNext.children }</> }
      }
      if (options.childAfter) {
        pNext = { ...pNext, children: <>{ pNext.children } { options.childAfter }</> }
      }

      const render = options.render;
      if (render) {
        return render({ ...props, Slot: makeSlot(props.children) });
      }

      return next({ name, props: pNext });
    }

    if (middleware) {
      return middleware(t, final)(elem);
    }

    return t(elem);
  }
}

//if try import in module
// start vision lib with conxtfw
// 
export class ImagoComponentFactory<T extends ComponentType> extends AbstractTemplateFactory implements ComponentFactory {
  private handlers: Record<string, React.FunctionComponent<Element>> = {};

  constructor(
    public readonly tag: NodeType,
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
        next(props);
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

  template(): AbstractTemplate {
    const options = this.options;

    // Components
    for (const c of options.components || []) {
      const t = c.template();
      this.handlers[`typeof:${c.type}`] = ({ name, props }) => this.resolveInOther(c.tag, t, props);
    }

    // Properties
    const properties = options.properties;

    if (properties) {
      for (const propName of Object.keys(properties)) {
        const p = properties[propName];
        this.handlers[`property:${propName}`] = ({ name, props }) => {
          return defaultElements[name](props);
        }
        if (p) {
          const mw = tagHandlerToMiddleware(p);
          const next = this.handlers[`property:${propName}`];
          this.handlers[`property:${propName}`] = elem => {
            return mw(next, next)(elem);
          }
        }
      }
    }

    // Tags
    for (const k in defaultElements) {
      this.handlers[k] = ({name, props}) => defaultElements[k as NodeType](props);
    }
    for (const t of Object.keys(options.tags || {})) {
      this.handlers[t] = ({ name, props }) => {
        return defaultElements[name](props);
      }
      const tags = options.tags;
      if (tags) {
        for (const [t, handler] of Object.entries(tags)) {
          const next = this.handlers[t];
          const mw = tagHandlerToMiddleware<any>(handler);

          this.handlers[t] = (elem) => mw(next, next)(elem);
        }
      }
    }

    //const children = options.children;

    //if (children) {
      //this.
    //}

    const render = options.render;

    if (render) {
      this.handlers[this.handlerId] = ({ name, props }) => {
        let properties = new Proxy<PropertyTypes<T['properties']>>({} as any, {
          get(target, prop, receiver) {
            return getProperty(props.children, prop as string);
          },
        });

        return render({ properties, Slot: makeSlot(props.children) });
      }
    } else {
      this.handlers[this.handlerId] = ({ name, props }) => defaultElements[name](props);
    }

    if (options.class) {
      const next = this.handlers[this.handlerId];
      this.handlers[this.handlerId] = ({ name, props }) => {
        if (typeof options.class === 'string') {
          return next({ name, props: { ...props, className: options.class }});
        } else if (typeof options.class === 'function') {
          const properties = new Proxy<PropertyTypes<T['properties']>>({} as any, {
            get(target, prop, receiver) {
              return getProperty(props.children, prop as string);
            },
          });
          return next({ name, props: { ...props, className: options.class(properties) }});
        }
      }
    }

    return new ImagoComponent(this.handlers);
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
        return name;
      }

      return this.handlers[handlerName()]({ name, props })
    }
  }
}

export function createComponent<T extends ComponentType<NodeType,any>>(selector: TypeSelector<T>, options: ImagoComponentOptions<T>) {
  return new ImagoComponentFactory(selector.tag, selector.type, options);
}

export function tagHandlerToMiddleware<T extends NodeType>(handler: TagHandler<T>): ImagoMiddleware<Element<T>> {
  return (next, final) => elem => {
    if (typeof handler === 'string') {
      return transform<T>({ class: handler })(next, final)(elem);
    } else if (typeof handler === 'function') {
      return handler({...elem.props as any, Slot: makeSlot(elem.props.children)});
    } else if (typeof handler === 'object') {
      return transform(handler)(next, next)(elem);
    }
    return next(elem);
  }
}

export function heading(options: Partial<HeadingTemplateOptions>): TOptions<'heading'> {
  return {
    middleware: (next, final) => (elem) => {
      const handler = options[`h${elem.props.level}`];
      if (handler) {
        const mw = tagHandlerToMiddleware(handler);
        return mw(next, final)(elem);
      } else {
        return next(elem);
      }
    }
  }
}
