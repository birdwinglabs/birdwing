import { createMiddlewareFactory } from ".";
import {
  ImagoMiddleware,
  NodeType,
  Element,
  TagHandler,
  NodeContext,
  NodeInfo,
  MiddlewareFactory,
} from "../interfaces";

class SelectMiddlewareFactory<T extends NodeType> extends MiddlewareFactory<T> {
  constructor(private select: (node: NodeContext<any>) => TagHandler<T>) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    return (next, final) => (elem) => {
      const handler = this.select(new NodeContext(nodes, elem.props));

      const fact = createMiddlewareFactory<T>(handler);

      return handler
        ? fact.createMiddleware(nodes)(next, final)(elem)
        : next(elem)
    }
  }
}

export function select<T extends NodeType>(fn: (node: NodeContext<any>) => TagHandler<T>) {
  return new SelectMiddlewareFactory(fn);
}
