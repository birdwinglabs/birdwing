import React from "react";
import { NodeConfig, RenderFunction } from "./interfaces.js";
import { Middleware } from "./middleware.js";

export function makeElementFactory(elements: Record<string, string | RenderFunction<any> | any>, name: string): RenderFunction<any> {
  const fact = elements[name];

  switch (typeof fact) {
    case 'string':
      return ({ children, ...props }: any) => React.createElement(fact, props, children);
    case 'object':
      return (props) => fact.render(props);
    case 'function':
      return fact;
    default:
      return ({ children, ...props }: any) => React.createElement(name, props, children);
  }
}

export function configureNode(elementFactory: RenderFunction<any>, config: NodeConfig<any>) {
  switch (typeof config) {
    case 'string':
      return (props: any) => elementFactory({ ...props, className: config });
    case 'function':
      return config;
    case 'object':
      if (config instanceof Middleware)  {
        return (props: any) => config.apply(props, elementFactory);
      }
    case 'boolean':
      if (config === false) {
        return () => '';
      }
    case 'undefined':
      return elementFactory;
  }
}
