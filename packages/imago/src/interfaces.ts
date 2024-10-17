import { Template } from "@birdwing/react";
import { Middleware } from "./middleware";

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


export interface HeadingConfig {
  h1?: NodeConfig<HeadingProps>;
  h2?: NodeConfig<HeadingProps>;
  h3?: NodeConfig<HeadingProps>;
  h4?: NodeConfig<HeadingProps>;
  h5?: NodeConfig<HeadingProps>;
  h6?: NodeConfig<HeadingProps>;
}

export type NodeConfig<T> = React.FunctionComponent<T> | Middleware<T> | string | false | undefined;

export interface TemplateNodeConfig extends Record<string, any> {
  link?: NodeConfig<LinkProps>,
  list?: NodeConfig<ListProps>,
  item?: NodeConfig<ItemProps>,
  fence?: NodeConfig<FenceProps>,
  heading?: NodeConfig<HeadingProps>,
  paragraph?: NodeConfig<ParagraphProps>,
}

export type ImagoHandler<T = any> = React.FunctionComponent<T>;
export type ImagoMiddleware<T = any> = (next: ImagoHandler<T> | (() => React.ReactElement | null), final: ImagoHandler<T>) => ImagoHandler<T>;

export interface TemplateConfig<T> {
  name: string,
  layout: NodeConfig<T>,
  //slots?: Record<string, TemplateNodeConfig>,
  slots?: Template[],
  children?: TemplateNodeConfig,
  elements?: Record<string, ImagoHandler>;
}
