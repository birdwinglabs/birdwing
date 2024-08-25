import { Node, Tag } from "@markdoc/markdoc";
import { Document } from "@tashmet/tashmet";

export interface SourceDocument {
  _id: string;

  frontmatter: Document;

  path: string;

  body: string;
}

export interface ParsedDocument extends SourceDocument {
  ast: Node;
}

export interface ContentTransform {
  url: string;

  data(fragments: Document): Promise<Document>;
}

export interface FragmentConfig extends ContentTransform {
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
