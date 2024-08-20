import { Node, RenderableTreeNode, Tag } from "@markdoc/markdoc";
import { Document } from "@tashmet/tashmet";

export interface RenderableDocument {
  _id: string;

  renderable: any;
}

export interface PageData {
  _id: string;

  path: string;

  body: string;

  ast: Node;

  renderable: RenderableTreeNode | undefined;

  frontmatter: Document;
}

export interface ContentTransform {
  render: string;

  url: string;

  nodes: Document;

  tags: string[];

  data(fragments: Document): Promise<Document>;
}

export interface FragmentConfig extends ContentTransform {
  name: string;

  output: (tag: Tag, variables: Document) => any;
}


export interface Route {
  _id: string;

  url: string;

  tag: Tag;
}

export interface TargetFile {
  _id: string;

  content: string;
}

export type PluginFactory = (config: any) => Plugin
