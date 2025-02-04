import { ComponentFactory, Element, HandlerProps, ImagoMiddleware, MiddlewareFactory, NodeInfo, NodeType, TagHandler, TagProps, TransformOptions } from "../interfaces";
import { makeNodeSlot } from "../utils";
import { ComponentMiddlewareFactory } from "./component";
import { TransformMiddlewareFactory } from "./transform";

export { ComponentMiddlewareFactory };

export class RenderMiddlewareFactory<T extends NodeType> extends MiddlewareFactory<T> {
  constructor(private render: React.FunctionComponent<HandlerProps<TagProps<T>>>) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    return () => elem => this.render({ ...elem.props, Slot: makeNodeSlot(elem.props.children) });
  }
}

export function createMiddlewareFactory<T extends NodeType>(handler: TagHandler<T>): MiddlewareFactory<T> {
  if (handler instanceof ComponentFactory) {
    return new ComponentMiddlewareFactory(handler);
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

  return new RenderMiddlewareFactory(handler);
}
