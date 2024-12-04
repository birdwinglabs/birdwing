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

export class Selector<T extends NodeProps> {
  constructor(
    public readonly type: NodeType,
    private attributes: Partial<T> = {},
    private classes: string[] = [],
  ) {}

  match(props: T): boolean {
    const propsClasses = (props.className as string || '').split(' ');

    return Object.entries(this.attributes).every(([k, v]) => v === undefined || (props as any)[k] === v)
      && (this.classes.every(c => propsClasses.indexOf(c) >= 0))
      //&& (matchClassNot ? ((props.className || '') as string).split(' ').indexOf(matchClassNot) < 0 : true)
  }

  withClass(...name: string[]): Selector<T> {
    return new Selector<T>(this.type, this.attributes, this.classes.concat(...name));
  }

  withAttr(attrs: Partial<T>): Selector<T> {
    return new Selector<T>(this.type, {...this.attributes, ...attrs}, this.classes);
  }
}