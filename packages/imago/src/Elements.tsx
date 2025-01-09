import React from "react";
import { Link, NavLink } from 'react-router-dom';
import { GridProps, HeadingProps, ItemProps, MetaProps, NodeProps, ParagraphProps, TileProps } from "./interfaces.js";
import { ImagoHandler } from "./interfaces.js";
import { CodeBlock } from "@birdwing/react";

export const defaultElements: Record<string, ImagoHandler> = {
  document: ({ children, className }: any) => {
    return <article className={className}>{ children }</article>;
  },
  meta: ({ ...props }: MetaProps) => {
    return <meta {...props}/>
  },
  layout: ({ children, className }: any) => {
    return <div className={className}>{ children }</div>;
  },
  section: ({ children, name, ...props }: NodeProps) => {
    return <div {...props}>{ children }</div>;
  },
  grid: ({ children, className }: GridProps) => {
    return <div className={className}>{ children }</div>;
  },
  tile: ({ children, className }: TileProps) => {
    return <div className={className}>{ children }</div>;
  },
  paragraph: ({ children, className }: ParagraphProps) => {
    return React.createElement('p', { className }, children)
  },
  strong: ({ children, className }: NodeProps) => {
    return React.createElement('strong', { className }, children)
  },
  code: ({ children, className }: NodeProps) => {
    return React.createElement('code', { className }, children)
  },
  em: ({ children, className }: NodeProps) => {
    return React.createElement('em', { className }, children)
  },
  image: ({ children, ...props }: NodeProps) => {
    return React.createElement('img', props, children)
  },
  fence: ({ children, language, className }: NodeProps) => {
    return <pre className={className}><CodeBlock language={language}>{ children }</CodeBlock></pre>;
  },
  html: ({ children, className }: NodeProps) => {
    return <div className={className} dangerouslySetInnerHTML={{__html: children as string }}/>
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
