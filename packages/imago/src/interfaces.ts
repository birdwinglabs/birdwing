import { Template } from "@birdwing/react";
import React from "react";


export interface NodeProps extends Record<string, any>{
  id?: string;
  className?: string | any;
  children?: React.ReactNode;
  name?: string;
  typeof?: string;
  property?: string;
  index: number;
  isLast: boolean;
}

export interface MetaProps extends NodeProps {
  content: string;
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

export abstract class AbstractSelector<T extends NodeProps> {
  constructor(public readonly type: NodeType) {}

  abstract match(props: T): boolean;
}

export interface TemplateOptions {
  slots?: Template[],
  elements?: Record<string, ImagoHandler>;
  selector?: AbstractSelector<any>;
}

export type NodeType = 
  'layout' |
  'document' |
  'meta' |
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
