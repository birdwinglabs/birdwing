import { Template } from "@birdwing/react";
import React from "react";
import { TemplateContext } from "./Imago";

export interface NodeProps extends Record<string, any>{
  id?: string;
  className?: string | any;
  children?: React.ReactNode;
  index: number;
  isLast: boolean;
}

export interface SectionProps extends NodeProps {
  name: string;
}

export interface GridProps extends NodeProps {
  name?: string;

  columns?: number;

  rows?: number;

  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
}

export interface TileProps extends NodeProps {
  name?: string;

  colspan?: number;

  rowspan?: number;

  order?: number;
}

export interface LinkProps extends NodeProps {
  href: string;
}

export interface ListProps extends NodeProps {
  ordered: boolean;
}

export interface ItemProps extends NodeProps {}

export interface FenceProps extends NodeProps {
  children: string;
  language: string;
  html?: boolean;
  height?: string;
}

export interface HeadingProps extends NodeProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphProps extends NodeProps {}

export type ImagoHandler<T = any> = React.FunctionComponent<T>;
export type ImagoMiddleware<T = any> = (next: ImagoHandler<T> | (() => React.ReactElement | null), final: ImagoHandler<T>) => ImagoHandler<T>;

export interface TemplateOptions {
  slots?: Template[],
  elements?: Record<string, ImagoHandler>;
}


export type NodeType = 
  'layout' |
  'section' |
  'grid' |
  'tile' |
  'heading' |
  'paragraph' |
  'hr' |
  'image' |
  'fence' |
  'html' |
  'blockquote' |
  'list' |
  'item' |
  'strong' |
  'link' |
  'code';

export type Matcher<T extends NodeProps> = (props: T) => boolean;

export class Selector<T extends NodeProps> {
  constructor(
    public readonly type: NodeType,
    private matchers: Matcher<T>[] = [],
  ) {}

  match(props: T): boolean {
    return this.matchers.every(m => m(props));
  }

  condition(condition: Matcher<T>) {
    return new Selector<T>(this.type, [...this.matchers, condition]);
  }

  withClass(...name: string[]): Selector<T> {
    return this.condition(({ className }) => {
      const classes = (className as string || '').split(' ');
      return name.every(c => classes.indexOf(c) >= 0)
    });
  }

  withoutClass(name: string): Selector<T> {
    return this.condition(({ className }) => !((className as string || '').split(' ').includes(name)));
  }

  withAttr(attrs: Partial<T>): Selector<T> {
    return this.condition(props => Object.entries(attrs).every(([k, v]) => v === undefined || (props as any)[k] === v));
  }

  withChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).some(c => React.isValidElement(c) && selector.match(c.props));
    });
  }

  withoutChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).every(c => !React.isValidElement(c) || !selector.match(c.props));
    });
  }
}
