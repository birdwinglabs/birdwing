import React, { isValidElement, createContext, FunctionComponent, ReactNode, useContext, ComponentClass } from "react";
import {
  AbstractSelector,
  AbstractTemplate,
  AbstractTemplateFactory,
  ImagoHandler,
  ImagoMiddleware,
  NodeProps,
  NodeType,
  TagProps,
  TemplateContext,
  TemplateOptions,
} from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { Selector } from "./selector.js";


export interface SlotProps {
  select?: Selector<any>;

  template?: AbstractTemplate | AbstractTemplateFactory;
}

export function slot(children: React.ReactNode) {
  return ({ select, template }: SlotProps) => {
    return <Imago.Project template={template} filter={select}>{ children }</Imago.Project>
  }
}

export function hasProperty(children: React.ReactNode, property: string) {
  return React.Children.toArray(children).some(c => React.isValidElement(c) && c.props.property === property);
}

export interface ProjectProps {
  template?: AbstractTemplate | AbstractTemplateFactory;

  filter?: Selector<any>;

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
  template?: AbstractTemplateFactory;
  children?: ImagoHandler<T>;
  childAfter?: ReactNode;
  childBefore?: ReactNode;
  final?: boolean;
}

export interface ImagoBuilder {
  template(): Imago;

  /**
   * Transform a node.
   * 
   * This operation selects a node and changes its props and/or children.
   * 
   * @param selector 
   * @param options
   */
  transform<T extends NodeType>(selector: Selector<T>, options: TransformOptions<TagProps<T>>): ImagoBuilder;

  /**
   * Render a node
   * 
   * This operation finishes the chain of middleware for the selected node and renders it.
   * 
   * @param selector 
   * @param element 
   */
  render<T extends NodeType>(selector: Selector<T>, element: string | FunctionComponent<TagProps<T>> | ComponentClass<TagProps<T>>): ImagoBuilder

  /**
   * Wrap a node in another component
   * 
   * @param selector 
   * @param wrapper 
   * @param wrapperProps 
   */
  wrap<T extends NodeType, U extends {}>(
    selector: Selector<T>,
    wrapper: string | FunctionComponent<U> | ComponentClass<U>,
    wrapperProps: Omit<U, 'children'>
  ): ImagoBuilder;

  /**
   * 
   * @param selector 
   * @param param1 
   */
  attributeToClass<T extends NodeType>(selector: Selector<T>, { name, values }: AttributeToClassOptions<TagProps<T>>): ImagoBuilder;

  /**
   * 
   * @param classes 
   */
  addClasses(classes: Partial<Record<NodeType, string>>): ImagoBuilder;

  use(middleware: AbstractTemplateFactory): ImagoBuilder;

  use<T extends NodeType>(type: T, middleware: ImagoMiddleware<TagProps<T>>): ImagoBuilder;
}

export class ImagoBuilder extends AbstractTemplateFactory {
  constructor(
    private final: Record<string, ImagoHandler> = { ...defaultElements },
    private middleware: Record<string, ImagoMiddleware[]> = {},
    private selector: AbstractSelector<any> | undefined = undefined,
  ) { super(); }

  template() {
    return new Imago(this.createHandlers());
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

  private useMany(types: NodeType[], middleware: ImagoMiddleware<NodeProps>): ImagoBuilder {
    for (const type of types) {
      this.use(type, middleware);
    }
    return this;
  }

  transform<T extends NodeType>(selector: Selector<T>, opts: TransformOptions<TagProps<T>>) {
    return this.useMany(selector.types, (next, finish) => props => {
      const n = opts.final ? finish : next;

      if (!selector.match(props as any)) {
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
        p = { ...p, children: opts.children(p as any) }
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

  render<T extends NodeType>(selector: Selector<T>, element: string | FunctionComponent<TagProps<T>> | ComponentClass<TagProps<T>>) {
    return this.useMany(selector.types, next => ({ children, ...props }) => selector.match({ children, ...props } as any)
      ? React.createElement(element, props as any, children)
      : next({ children, ...props } as any));
  }

  wrap<T extends NodeType, U extends {}>(selector: Selector<T>, wrapper: string | FunctionComponent<U> | ComponentClass<U>, wrapperProps: Omit<U, 'children'>) {
    return this.useMany(selector.types, next => ({ children, ...props }) => selector.match({ children, ...props } as any)
      ? React.createElement(wrapper, wrapperProps as any, next({ children, ...props }))
      : next({ children, ...props } as any));
  }

  attributeToClass<T extends NodeType>(selector: Selector<T>, { name, values }: AttributeToClassOptions<TagProps<T>>) {
    return this.useMany(selector.types, next => props => {
      if (selector.match(props as any) && (props as any)[name] in values) {
        return next({ ...props, className: [props.className, values[(props as any)[name]]].join(' ').trim() });
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

  public use<T = any>(arg1: string | AbstractTemplateFactory, arg2?: ImagoMiddleware<T>): this {
    if (typeof arg1 === 'string' && arg2) {
      if (!this.middleware[arg1]) {
        this.middleware[arg1] = [];
      }
      this.middleware[arg1].push(arg2);
    }

    if (typeof arg1 === 'object') {
      arg1.applyMiddleware(this);
    }

    return this;
  }

  public applyMiddleware(parent: AbstractTemplateFactory) {
    const selector = this.selector;

    if (selector) {
      for (const type of selector.types) {
        parent.use(type, next => ({ children, ...props }) => {
          if (selector.match({ children, ...props } as any)) {
            const t = this.template();
            const handler = this.createHandlers()[type];
            return (
              <TemplateContext.Provider value={t}>
                { handler({ children, ...props })}
              </TemplateContext.Provider>
            );
          } else {
            return next({ children, ...props} as any);
          }
        });
      }
    } else {
      for (const [name, middleware] of Object.entries(this.middleware)) {
        for (const m of middleware) {
          parent.use(name as NodeType, m);
        }
      }
    }
  }
}

export class Imago extends AbstractTemplate {
  constructor(private handlers: Record<string, ImagoHandler>) { super(); }

  static configure(options?: TemplateOptions) {
    const final = { ...defaultElements, ...options?.elements || {} };
    return new ImagoBuilder(final, {}, options?.selector);
  }

  static Project({ template, children, filter, enumerate }: ProjectProps) {
    if (filter) {
      children = React.Children.toArray(children).filter(c => {
        if (isValidElement(c)) {
          return filter.types.some(type => type === (c.type as any).displayName && filter.match(c.props));
        }
        return false;
      });
    }

    return template
      ? <TemplateContext.Provider value={template instanceof AbstractTemplateFactory ? template.template() : template}>{ children }</TemplateContext.Provider>
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

