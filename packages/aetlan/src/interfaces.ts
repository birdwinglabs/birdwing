import Tashmet from "@tashmet/tashmet";

export interface File {
  path: string;

  content: string;
}

export type Transform = (doc: RenderableDocument) => Promise<File>

export interface DocumentSource {
  create(name: string, tashmet: Tashmet): Promise<void>;

  read(customTags: string[], filePath?: string): Promise<RenderableDocument[]>

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
  renderable: any;

  data: Record<string, any>;

  customTags: string[];
}
