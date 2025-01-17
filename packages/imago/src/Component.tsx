import React, { createContext, useContext } from "react";
import { AbstractTemplate, ImagoComponentOptions, ImagoMiddleware, NodeProps, NodeType, PropertyTypes, ComponentType, Element, TagProps, TemplateContext, TypeSelector, AbstractTemplateFactory, SlotOptions, ComponentFactory, TOptions, HeadingTemplateOptions, TagHandler } from "./interfaces";
import { defaultElements } from "./Elements";
import { SlotProps } from "./Imago";

function makeRenderProps(props: NodeProps, typeMap: TypeMap) {
  return { ...props, Slot: makeSlot(props.children), properties: typeMap.get(props.k) };
}

export interface TypeContextProperty {
  value: any;

  index: number | undefined;

  key: any;
}

const listProps = new Set(['step', 'tab', 'panel', 'contentSection']);

class TypeMap {
  public types: Map<number, any> = new Map();

  get(key: number) {
    return this.types.has(key) ? this.types.get(key) : {};
  }

  parse(tag: NodeType, props: NodeProps): Property {
    const childProps: Property[] = [...this.parseProperties(props)]

    if (childProps.length === 0) {
      if (props.typeof) {
        return { name: props.property as string, key: props.k, value: { '@type': props.typeof }};
      }
      return { name: props.property as string, key: props.k, value: parseValue(tag, props) };
    }

    const p: Property = {
      key: props.k,
      name: props.property as string,
      value: { '@type': props.typeof },
    }

    for (const cp of childProps) {
      if (listProps.has(cp.name)) {
        if (!p.value[cp.name]) {
          p.value[cp.name] = [];
        }
        p.value[cp.name].push(cp.value);
      } else {
        p.value[cp.name] = cp.value;
      }
    }

    this.types.set(p.key, p.value);

    return p;
  }

  private * parseProperties(props: NodeProps): Generator<Property> {
    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        if (c.props.property) {
          const p = this.parse((c.type as any).displayName, c.props);
          yield p;
        } else {
          for (const p of this.parseProperties(c.props)) {
            yield p;
          }
        }
      }
    }
  }
}

export const TypeContext = createContext<TypeMap>(new TypeMap());

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
      if (options.children) {
        pNext = { ...pNext, children: <>{ options.children({ ...pNext, Slot: makeSlot(pNext.children) })}</>}
      }
      if (options.childBefore) {
        pNext = { ...pNext, children: <>{ options.childBefore } { pNext.children }</> }
      }
      if (options.childAfter) {
        pNext = { ...pNext, children: <>{ pNext.children } { options.childAfter }</> }
      }

      const render = options.render;
      if (render) {
        return render({ ...pNext, Slot: makeSlot(pNext.children) });
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

  private createDefaultHandler(): React.FunctionComponent<Element> {
    return ({ name, props }) => defaultElements[name](props);
  }

  private createPropertyHandler(property: TagHandler<NodeType>): React.FunctionComponent<Element> {
    const next = this.createDefaultHandler();
    const mw = tagHandlerToMiddleware(property);
    return (elem) => mw(next, next)(elem);
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
        this.handlers[`property:${propName}`] = p
          ? this.createPropertyHandler(p as any)
          : this.createDefaultHandler()
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

    const render = options.render;

    if (render) {
      this.handlers[this.handlerId] = ({ name, props }) => {
        return (
          <TypeContext.Consumer>
            { typeMap => render(makeRenderProps(props, typeMap)) }
          </TypeContext.Consumer>
        );
      }
    } else {
      this.handlers[this.handlerId] = ({ name, props }) => defaultElements[name](props);
    }

    const children = options.children;

    if (children) {
      const next = this.handlers[this.handlerId];
      this.handlers[this.handlerId] = ({ name, props }) => {
        return (
          <TypeContext.Consumer>
            { typeMap => next({ name, props: { ...props, children: children(makeRenderProps(props, typeMap) as any)}})}
          </TypeContext.Consumer>
        );
      }
    }

    const cls = options.class;

    if (cls) {
      const next = this.handlers[this.handlerId];
      this.handlers[this.handlerId] = ({ name, props }) => {
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

    return new ImagoComponent(this.handlers);
  }

  private get handlerId() {
    return `typeof:${this.type}`;
  }
}

interface Property {
  name: string;
  value: any;
  key: number;
}

function parseValue<T extends NodeType>(tag: NodeType, props: TagProps<T>) {
  switch (tag) {
    case 'link': return props.href;
    case 'item':
    case 'paragraph':
    case 'heading':
      return props.children?.toString();
    case 'value':
      return props.content;
    default:
      return undefined;
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

      if (name === 'document') {
        const tm = new TypeMap();
        tm.parse(name, props);
        return (
          <TypeContext.Provider value={tm}>
            { this.handlers[handlerName()]({ name, props: { ...props } }) }
          </TypeContext.Provider>
        )
      }
      return this.handlers[handlerName()]({ name, props });
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
