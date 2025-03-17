import { ComponentFactory, ComponentResolver, Element, ImagoMiddleware, MiddlewareFactory, NodeContext, NodeInfo, TagHandler } from "../interfaces";
import { makeNodeSlot } from "../utils";
import { ComponentMiddlewareFactory } from "./component";
import { TransformMiddlewareFactory } from "./transform";
import { NodeType } from '@birdwing/renderable';

export { ComponentMiddlewareFactory };

class SelectMiddlewareFactory<T extends NodeType, TSchema> extends MiddlewareFactory<T> {
  constructor(private componentResolver: ComponentResolver, private select: (node: NodeContext<TSchema>) => TagHandler<T, TSchema>) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    return (next, final) => (elem) => {
      const handler = this.select(new NodeContext(nodes, elem.props));

      const fact = createMiddlewareFactory<T>(this.componentResolver, handler);

      return handler
        ? fact.createMiddleware(nodes)(next, final)(elem)
        : next(elem)
    }
  }
}

export function createMiddlewareFactory<T extends NodeType>(componentResolver: ComponentResolver, handler: TagHandler<T, any>): MiddlewareFactory<T> {
  if (handler instanceof ComponentFactory) {
    return new ComponentMiddlewareFactory(componentResolver, handler);
  }

  if (handler instanceof MiddlewareFactory) {
    return handler;
  }

  if (typeof handler === 'string') {
    return new TransformMiddlewareFactory({ class: handler }, ({ children }) => makeNodeSlot(children));
  }

  if (typeof handler === 'object') {
    return new TransformMiddlewareFactory(handler, ({ children }) => makeNodeSlot(children));
  }

  return new SelectMiddlewareFactory(componentResolver, handler);
}
