import React from "react";
import { NodeConfig } from "./interfaces.js";
import { Middleware } from "./middleware.js";

export function makeElementFactory(elements: Record<string, string | React.FunctionComponent<any> | any>, name: string): React.FunctionComponent<any> {
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

export function configureNode(elementFactory: React.FunctionComponent<any>, config: NodeConfig<any>): React.FunctionComponent<any> {
  switch (typeof config) {
    case 'string':
      return (props: any) => elementFactory({ ...props, className: config });
    case 'function':
      return config as React.FunctionComponent;
    case 'object':
      if (config instanceof Middleware)  {
        return (props: any) => config.apply(props, elementFactory);
      }
    case 'boolean':
      if (config === false) {
        return () => null;
      }
    case 'undefined':
      return elementFactory;
  }
}
