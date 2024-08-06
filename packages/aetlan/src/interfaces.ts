import { RenderableTreeNode } from "@markdoc/markdoc";
import Tashmet, { Document, Filter, FindCursor } from "@tashmet/tashmet";

export interface File {
  path: string;

  content: string;
}

export type Transform = (doc: RenderableDocument) => Promise<File>

export interface TransformContext {
  findPages(filter: Filter<Document>): FindCursor<Document>;

  mount(slug: string, renderable: any): Promise<void>;

  url(path: string): Promise<string>;

  urls: Record<string, string>;
  //slugify(page: any): string;
}

export interface DocumentSource {
  url(page: any): string;

  data(page: any, context: TransformContext): Promise<any>;

  transform(page: any, urls: Record<string, string>): Promise<RenderableTreeNode>;

  //update(doc: any, context: TransformContext): Promise<void>;

  path: string;
}

export interface Target {
  component(name: string, filePath: string, prerender: boolean): Promise<void>;

  transforms: Record<string, Transform>;
}

export interface Pipeline {
  name: string;

  components: string;

  postrender: string[];

  source: DocumentSource;

  target: Target;
}

export interface RenderableDocument {
  _id: string;

  renderable: any;
}
