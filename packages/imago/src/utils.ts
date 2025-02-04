import {
  ComponentFactory,
  Element,
  ImagoMiddleware,
  MiddlewareFactory,
  NodeInfo,
  NodeType,
  TagHandler,
} from "./interfaces";
//import { ComponentMiddlewareFactory, RenderMiddlewareFactory, TransformMiddlewareFactory } from "./middeware";

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

export function makeNodeSlot(children: React.ReactNode) {
  return () => {
    return children;
  }
}

export function makeComponentSlot(children: React.ReactNode, nodes: Record<number, NodeInfo>, key: number) {
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

//export function tagHandlerToMiddleware<T extends NodeType>(
  //handler: TagHandler<T>,
  //nodes: Record<number, NodeInfo>
//): ImagoMiddleware<Element<T>> {
  //if (handler instanceof ComponentFactory) {
    //const fact = new ComponentMiddlewareFactory<T>(handler);
    //return fact.createMiddleware(nodes);
    ////return () => elem => resolveInOther(elem.name, handler.createTemplate(nodes, elem.props), elem.props);
  //}

  //if (handler instanceof MiddlewareFactory) {
    //return handler.createMiddleware(nodes);
  //}

  //if (typeof handler === 'string') {
    //const fact = new TransformMiddlewareFactory<T>({ class: handler });
    //return fact.createMiddleware(nodes);

    ////return transform({ class: handler }, props => makeNodeSlot(props.children));
  //}

  //if (typeof handler === 'object') {
    //const fact = new TransformMiddlewareFactory<T>(handler);
    //return fact.createMiddleware(nodes);
    ////return transform(handler, props => makeNodeSlot(props.children));
  //}

  //if (typeof handler === 'function') {
    //const fact = new RenderMiddlewareFactory<T>(handler);
    //return fact.createMiddleware(nodes);
    ////return () => elem => handler({...elem.props as any, Slot: makeNodeSlot(elem.props.children)});
  //}

  //return next => elem => next(elem);
//}
