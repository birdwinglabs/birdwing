import React from "react";
import { Link, NavLink } from 'react-router-dom';
import { RenderFunction } from '@birdwing/react';
import { HeadingProps } from "./interfaces.js";

export const defaultElements: Record<string, string | RenderFunction<any>> = {
  layout: 'div',
  paragraph: 'p',
  item: 'li',
  list({ children, ordered, ...props }) {
    return ordered
      ? <ol {...props}>{ children }</ol>
      : <ul {...props}>{ children }</ul>;
  },
  heading({ children, level, ...props }: HeadingProps) {
    return React.createElement(`h${level}`, props, children);
  },
  link({ href, children, nav, ...props }) {
    return nav === true
      ? <NavLink to={href} {...props}>{ children }</NavLink>
      : <Link to={href} {...props}>{ children }</Link>;
  }
}
