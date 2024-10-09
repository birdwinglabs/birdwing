import { Middleware } from "./Template";

export interface NodeProps {
  id?: string;
  className?: string;
  children?: React.ReactNode[];
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
  content?: string;
}

export interface HeadingProps extends NodeProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphProps extends NodeProps {}

export type RenderFunction<T> = (props: T) => React.ReactNode;

//export type HeadingLevelConfig = RenderFunction<Omit<HeadingProps, 'level'>> | string | false;

export interface HeadingConfig {
  h1?: NodeConfig<HeadingProps>;
  h2?: NodeConfig<HeadingProps>;
  h3?: NodeConfig<HeadingProps>;
  h4?: NodeConfig<HeadingProps>;
  h5?: NodeConfig<HeadingProps>;
  h6?: NodeConfig<HeadingProps>;
}

export type NodeConfig<T> = RenderFunction<T> | Middleware<T> | string | false | undefined;

export interface TemplateNodeConfig extends Record<string, any> {
  link?: NodeConfig<LinkProps>,
  list?: NodeConfig<ListProps>,
  item?: NodeConfig<ItemProps>,
  fence?: NodeConfig<FenceProps>,
  heading?: NodeConfig<HeadingProps>,
  paragraph?: NodeConfig<ParagraphProps>,
}

export interface TemplateConfig<T> {
  name: string,
  layout: NodeConfig<T>,
  slots?: Record<string, TemplateNodeConfig>,
  children?: TemplateNodeConfig,
  elements?: Record<string, string | RenderFunction<any>>;
}
