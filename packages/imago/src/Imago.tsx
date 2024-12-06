import React, { isValidElement, createContext, FunctionComponent, ReactNode, useContext, ComponentClass } from "react";
import { ComponentDescription, Template } from '@birdwing/react';
import {
  FenceProps,
  GridProps,
  HeadingProps,
  ImagoHandler,
  ImagoMiddleware,
  ItemProps,
  ListProps,
  NodeProps,
  NodeType,
  ParagraphProps,
  SectionProps,
  Selector,
  TemplateOptions,
  TileProps
} from "./interfaces.js";
import { defaultElements } from "./Elements.js";

const TemplateContext = createContext<Imago | undefined>(undefined);

export interface ProjectProps {
  template?: ImagoBuilder;

  filter?: Selector<any> | Selector<any>[]

  children: React.ReactNode;

  enumerate?: boolean;
}

export class Ordering {
  constructor(public readonly index: number, public readonly total: number) {}

  get isFirst() { return this.index === 0; }
  get isLast() { return this.index === this.total - 1; }
}

export const OrderingContext = createContext(new Ordering(0, 0));

export interface AttributeToClassOptions<T extends NodeProps> {
  name: keyof T;
  values: Record<string | number, string>;
}

export interface TransformOptions<T> {
  /** Set the class  */
  class?: string | string[];
  addClass?: string | string[];
  template?: ImagoBuilder;
  children?: ImagoHandler<T>;
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  final?: boolean;
}

export class ImagoTemplate extends Template {
  private components: Record<string, ImagoResolver> = {};

  component(name: string, component: ImagoResolver) {
    this.components[name] = component;
    return this;
  }

  resolve(component: ComponentDescription, node?: string): React.FunctionComponent<any> {
    if (!this.components[component.name]) {
      this.components[component.name] = Imago.configure().component();
    }
    return this.components[component.name].resolve(component.attributes, node);
  }
}


export interface ImagoBuilder {
  template(): Imago;

  addClasses(classes: Partial<Record<NodeType, string>>): ImagoBuilder;

  use(middleware: ImagoBuilder): ImagoBuilder;
  use(type: 'layout', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'section', middleware: ImagoMiddleware<SectionProps>): ImagoBuilder;
  use(type: 'grid', middleware: ImagoMiddleware<GridProps>): ImagoBuilder;
  use(type: 'tile', middleware: ImagoMiddleware<TileProps>): ImagoBuilder;
  use(type: 'heading', middleware: ImagoMiddleware<HeadingProps>): ImagoBuilder;
  use(type: 'paragraph', middleware: ImagoMiddleware<ParagraphProps>): ImagoBuilder;
  use(type: 'hr', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'image', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'fence', middleware: ImagoMiddleware<FenceProps>): ImagoBuilder;
  use(type: 'html', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'blockquote', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'list', middleware: ImagoMiddleware<ListProps>): ImagoBuilder;
  use(type: 'item', middleware: ImagoMiddleware<ItemProps>): ImagoBuilder;
  use(type: 'strong', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'link', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
  use(type: 'code', middleware: ImagoMiddleware<NodeProps>): ImagoBuilder;
}

export interface ImagoResolver {
  resolve(attributes: any, node?: string): FunctionComponent<any>
}

export class ImagoSwitch<T extends Record<string, any>> implements ImagoResolver {
  constructor(private resolver: (attrs: T) => ImagoComponent<T>) {}

  resolve(attrs: any, node?: string) {
    return this.resolver(attrs).resolve(attrs, node);
  }
}

export class ImagoComponent<T extends NodeProps> implements ImagoResolver {
  constructor(private template: Imago, private render: FunctionComponent<T>) {}

  resolve(attrs: any, node?: string) {
    if (!node) {
      return (props: T) => (
        <TemplateContext.Provider value={undefined}>
          { this.render(props) }
        </TemplateContext.Provider>
      );
    } else {
      return this.template.resolve(node);
    }
  }
}

export class ImagoBuilder {
  constructor(
    private final: Record<string, ImagoHandler> = { ...defaultElements },
    public  middleware: Record<string, ImagoMiddleware[]> = {},
  ) {}

  template() {
    return new Imago(this.createHandlers());
  }

  component<T extends NodeProps = NodeProps>(render?: FunctionComponent<T>) {
    const defaultRender = ({ children, className, id }: NodeProps) => React.createElement('div', { className, id }, children);
    return new ImagoComponent(this.template(), render || defaultRender);
  }

  private createHandlers() {
    const handlerMap: Record<string, ImagoHandler> = { ...this.final };

    for (const [name, middleware] of Object.entries(this.middleware)) {
      const final = this.final[name];

      for (const mw of middleware.slice().reverse()) {
        let next = handlerMap[name];
        if (!next) {
          throw Error(`Next handler missing for '${name}'`);
        }
        handlerMap[name] = props => mw(p => p ? next(p) : next(props), p => p ? final(p) : final(props))(props)
      }
    }
    return handlerMap;
  }

  transform<T extends NodeProps>(selector: Selector<T>, opts: TransformOptions<T>) {
    return this.use(selector.type, (next, finish) => props => {
      const n = opts.final ? finish : next;

      if (!selector.match(props)) {
        return next(props);
      }

      let p = props;

      if (opts.class) {
        p = { ...p, className: Array.isArray(opts.class) ? opts.class.join(' ') : opts.class };
      }

      if (opts.addClass) {
        const oldClass = props.className as string || '';
        const newClass = Array.isArray(opts.addClass) ? opts.addClass.join(' ') : opts.addClass;
        p = { ...p, className: [oldClass, newClass].join(' ').trim() };
      }

      if (opts.children) {
        p = { ...p, children: opts.children(p) }
      }
      
      if (opts.childBefore) {
        p = { ...p, children: <>{ opts.childBefore } { p.children }</> }
      }

      if (opts.childAfter) {
        p = { ...p, children: <>{ p.children } { opts.childAfter }</> }
      }

      if (opts.template) {
        p = { ...p, children: (
          <TemplateContext.Provider value={opts.template.template()}>{ p.children }</TemplateContext.Provider>
        )}
      }

      return n(p);
    })
  }

  render<T extends NodeProps>(selector: Selector<T>, component: FunctionComponent<T>) {
    return this.use(selector.type, next => props => selector.match(props) ? component(props) : next(props));
  }

  element<T extends NodeProps>(selector: Selector<T>, element: string | FunctionComponent<T> | ComponentClass<T>) {
    return this.use(selector.type, next => ({ children, ...props }) => selector.match({ children, ...props } as any)
      ? React.createElement(element, props as any, children)
      : next({ children, ...props } as any));
  }

  wrap<T extends NodeProps, U extends {}>(selector: Selector<T>, wrapper: string | FunctionComponent<U> | ComponentClass<U>, wrapperProps: Omit<U, 'children'>) {
    return this.use(selector.type, next => ({ children, ...props }) => selector.match({ children, ...props } as any)
      ? React.createElement(wrapper, wrapperProps as any, next({ children, ...props }))
      : next({ children, ...props } as any));
  }

  attributeToClass<T extends NodeProps>(selector: Selector<T>, { name, values }: AttributeToClassOptions<T>) {
    return this.use(selector.type, next => props => {
      if (selector.match(props) && props[name] in values) {
        return next({ ...props, className: [props.className, values[props[name]]].join(' ').trim() });
      } else {
        return next(props);
      }
    });
  }

  addClasses(classes: Partial<Record<NodeType, string>>) {
    for (const type of Object.keys(classes)) {
      this.transform(new Selector<any>(type as NodeType), {
        addClass: classes[type as NodeType]
      });
    }
    return this;
  }

  public use<T = any>(arg1: string | ImagoBuilder, arg2?: ImagoMiddleware<T>): this {
    if (typeof arg1 === 'string' && arg2) {
      if (!this.middleware[arg1]) {
        this.middleware[arg1] = [];
      }
      this.middleware[arg1].push(arg2);
    }

    if (typeof arg1 === 'object') {
      for (const [name, middleware] of Object.entries(arg1.middleware)) {
        for (const m of middleware) {
          this.use(name, m);
        }
      }
    }

    return this;
  }
}

export class Imago {
  constructor(private handlers: Record<string, ImagoHandler>) {}

  static configure(options?: TemplateOptions) {
    const final = { ...defaultElements, ...options?.elements || {} };
    return new ImagoBuilder(final, {});
  }

  static resolver<T extends Record<string, any>>(resolver: (attrs: T) => ImagoComponent<any>) {
    return new ImagoSwitch(resolver);
  }

  static Project({ template, children, filter, enumerate }: ProjectProps) {
    if (filter) {
      const filters = Array.isArray(filter) ? filter : [filter];
      children = React.Children.toArray(children).filter(c => {
        if (isValidElement(c)) {
          return filters.some(f => f.type === (c.type as any).displayName && f.match(c.props));
        }
        return false;
      });
    }

    return template
      ? <TemplateContext.Provider value={template.template()}>{ children }</TemplateContext.Provider>
      : <>{ children }</>;
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
    const Component: React.FunctionComponent = (p: any) => {
      const template = useContext(TemplateContext)

      if (template && template !== this) {
        return template.resolve(node)(p);
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
}
