import React from "react";
import { Link, NavLink } from 'react-router-dom';
import { HeadingProps, ItemProps, ParagraphProps } from "./interfaces.js";
import { ImagoHandler } from "./interfaces.js";

export const defaultElements: Record<string, ImagoHandler> = {
  layout: ({ children, className }: any) => {
    return <div className={className}>{ children }</div>;
  },
  paragraph: ({ children, ...props }: ParagraphProps) => {
    return React.createElement('p', props, children)
  },
  item: ({ children, ...props }: ItemProps) => {
    return React.createElement('li', props, children)
  },
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
