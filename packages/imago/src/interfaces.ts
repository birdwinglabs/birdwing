import { Template } from "@birdwing/react";

export interface NodeProps extends Record<string, any>{
  id?: string;
  className?: string | any;
  children?: React.ReactNode;
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
  language?: string;
  html?: boolean;
  height: string;
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

export interface ProjectProps {
  slot?: string;

  type?: string[];

  nodes: React.ReactNode[];

  enumerate?: boolean;
}
