import React from "react";
import { Link, NavLink } from 'react-router-dom';
import { GridProps, HeadingProps, ItemProps, NodeProps, ParagraphProps, SectionProps, TileProps } from "./interfaces.js";
import { ImagoHandler } from "./interfaces.js";

export const defaultElements: Record<string, ImagoHandler> = {
  layout: ({ children, className }: any) => {
    return <div className={className}>{ children }</div>;
  },
  section: ({ name, children, className }: SectionProps) => {
    return <div className={[name, className].join(' ')}>{ children }</div>;
  },
  grid: ({ name, children, className }: GridProps) => {
    return <div className={[name, className].join(' ')}>{ children }</div>;
  },
  tile: ({ name, children, className }: TileProps) => {
    return <div className={[name, className].join(' ')}>{ children }</div>;
  },
  paragraph: ({ children, ...props }: ParagraphProps) => {
    return React.createElement('p', props, children)
  },
  strong: ({ children, className }: NodeProps) => {
    return React.createElement('strong', { className }, children)
  },
  code: ({ children, ...props }: NodeProps) => {
    return React.createElement('code', props, children)
  },
  image: ({ children, ...props }: NodeProps) => {
    return React.createElement('img', props, children)
  },
  svg: ({ content, className }: NodeProps) => {
    return <div className={className} dangerouslySetInnerHTML={{__html: content}}/>
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
