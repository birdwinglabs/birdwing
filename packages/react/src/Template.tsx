import React, { createContext, useContext } from "react";
import { Link, NavLink } from 'react-router-dom';
import { FenceProps, HeadingConfig, HeadingProps, ItemProps, LinkProps, ListProps, ParagraphProps, RenderFunction, TemplateConfig } from "./interfaces.js";

const TemplateContext = createContext<string | undefined>(undefined);

export class Template<T extends { children?: React.ReactNode[] }> {
  constructor(private config: TemplateConfig<T>) {}

  get name() {
    return this.config.name;
  }

  static slot(name: string, children: React.ReactNode[]) {
    return <TemplateContext.Provider value={name}>{ children }</TemplateContext.Provider>;
  }

  resolve(node: string, slot?: string) {
    if (node === 'layout') {
      return ({ children, ...props}: T) => {
        const renderLayout = (layout: any) => {
          switch (typeof layout) {
            case 'function':
              return layout({ ...props, children });
            case 'object':
              const { as, ...newProps } = layout;
              return React.createElement(as, newProps, children);
            case 'string':
              return React.createElement('div', { ...props, className: layout }, children);
            default:
              return React.createElement('div', props, children);
          }
        }
        return (
          <TemplateContext.Provider value={undefined}>
            { renderLayout(this.config.layout) }
          </TemplateContext.Provider>
        );
      }
    }

    switch (node) {
      case 'heading':
        return this.heading(slot);
      case 'paragraph':
        return this.paragraph(slot);
      case 'link':
        return this.link(slot);
      case 'list':
        return this.list(slot);
      case 'item':
        return this.item(slot);
      case 'fence':
        return this.fence(slot);
      default:
        return this.anyNode(node, slot)
    }
  }

  private node(name: string, context?: string) {
    try {
      if (this.config.slots && context !== undefined && this.config.slots[context]) {
        return this.config.slots[context][name];
      } else {
        return this.config.nodes !== undefined ? this.config.nodes[name] : undefined;
      }
    } catch (err) {
      console.log(name + ', ' + context);
      console.log(this.config)
      throw new Error('missing config');
    }
  }

  private anyNode(name: string, slot?: string) {
    return (props: any) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node(name, context);
      switch (typeof node) {
        case 'function':
          return node(props);
        case 'object':
          const { as, ...newProps } = node;
          return React.createElement(as, newProps, props.children);
        case 'boolean':
          if (node === false) {
            return '';
          }
        default:
          return '';
      }
    }
  }

  private heading(slot?: string) {
    return ({className, level, children}: HeadingProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node('heading', context);
      switch (typeof node) {
        case 'function': return node({ className, level, children });
        case 'object':
          const type: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' = `h${level}`;
          const h = node[type];
          switch (typeof h) {
            case 'string':
              return React.createElement(type, { className: h }, children);
            case 'function':
              return h({ className, level, children });
            case 'boolean':
              if (h === false) {
                return '';
              }
            default:
              return React.createElement(type, { className }, children);

          }
        case 'boolean':
          if (node === false) {
            return '';
          }
        case 'undefined':
          return React.createElement(`h${level}`, { className }, children);
      }
    }
  }

  private paragraph(slot?: string) {
    return ({ children, className }: ParagraphProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node('paragraph', context);
      return typeof node === 'function' ? node({ className, children }) : <p className={node || className}>{ children }</p>;
    }
  }

  private list(slot?: string) {
    return (props: ListProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node('list', context);
      switch (typeof node) {
        case 'function':
          return node(props);
        case 'object':
          const { as, ...restProps } = node;
          return React.createElement(as, restProps, props.children);
        default:
          return props.ordered
            ? <ol className={node || props.className}>{ props.children }</ol>
            : <ul className={node || props.className}>{ props.children }</ul>;
      }
    }
  }

  private item(slot?: string) {
    return (props: ItemProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node('item', context);
      switch (typeof node) {
        case 'function':
          return node(props);
        case 'object':
          const { as, ...newProps } = node;
          return React.createElement(as, newProps, props.children);
        default:
          return <li className={node}>{ props.children }</li>
      }
    }
  }

  private link(slot?: string) {
    return ({ children, href, className }: LinkProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = this.node('link', context);
      switch (typeof node) {
        case 'function':
          return node({ children, href, className });
        case 'object':
          return <NavLink to={href} end className={({isActive}) => isActive ? node.active : node.inactive }>{ children }</NavLink>
        default:
          return <Link to={href} className={node || className}>{ children }</Link>;
      }
    }
  }

  private fence(slot?: string) {
    return ({...props}: FenceProps) => {
      const context = useContext(TemplateContext) || slot;
      const node = context ? this.config.slots[context].fence : this.config.nodes.fence;
      return typeof node === 'function' ? node(props) : <code className={node} {...props}></code>;
    }
  }
}
