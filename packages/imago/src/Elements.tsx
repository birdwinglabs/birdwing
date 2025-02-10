import { Link, NavLink } from 'react-router-dom';
import { NodeProps } from "./interfaces.js";
import { NodeType } from '@birdwing/renderable';
import { ImagoHandler } from "./interfaces.js";

export const defaultElements: Partial<Record<NodeType, ImagoHandler>> = {
  document: ({ children, className }: any) => {
    return <article className={className}>{ children }</article>;
  },
  pre: ({ children, ...props }: NodeProps) => {
    return <pre>{ children }</pre>;
  },
  a({ href, children, nav, ...props }) {
    return nav === true
      ? <NavLink to={href} {...props}>{ children }</NavLink>
      : <Link to={href} {...props}>{ children }</Link>;
  }
}
