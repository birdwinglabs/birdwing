
export interface LinkProps {
  className?: string;
  href: string;
  children?: React.ReactNode[];
}

export interface ListProps {
  className?: string;
  ordered: boolean;
  children?: React.ReactNode[];
}

export interface ItemProps {
  className?: string;
  children?: React.ReactNode[];
}

export interface FenceProps {
  className?: string;
  language?: string;
  content?: string;
}

export interface HeadingProps {
  className?: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode[];
}

export interface ParagraphProps {
  className?: string;
  children?: React.ReactNode[];
}

export type RenderFunction<T> = (props: T) => React.ReactNode;

export interface HeadingConfig {
  h1?: RenderFunction<HeadingProps> | string,
  h2?: RenderFunction<HeadingProps> | string,
  h3?: RenderFunction<HeadingProps> | string,
  h4?: RenderFunction<HeadingProps> | string,
  h5?: RenderFunction<HeadingProps> | string,
  h6?: RenderFunction<HeadingProps> | string,
}

export interface TemplateNodeConfig extends Record<string, any> {
  link?: RenderFunction<LinkProps> | string,
  list?: RenderFunction<ListProps> | string,
  item?: RenderFunction<ItemProps> | string,
  fence?: RenderFunction<FenceProps> | string,
  heading?: HeadingConfig | RenderFunction<HeadingProps>,
  paragraph?: RenderFunction<ParagraphProps> | string,
}

export interface TemplateConfig<T> {
  name: string,
  layout: RenderFunction<T>,
  slots: Record<string, TemplateNodeConfig>,
  nodes: TemplateNodeConfig,
}
