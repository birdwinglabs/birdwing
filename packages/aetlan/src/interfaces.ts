import Tashmet from "@tashmet/tashmet";

export interface File {
  path: string;

  content: string;
}

export type Transform = (doc: RenderableDocument) => Promise<File>

export interface DocumentSource {
  create(name: string, tashmet: Tashmet): Promise<void>;

  read(filePath?: string): Promise<RenderableDocument[]>
}

export interface Target {
  compile(): Promise<void>;

  transforms: Record<string, Transform>;
}

export interface Pipeline {
  name: string;

  source: DocumentSource;

  target: Target;
}

export interface RenderableDocument {
  renderable: any;

  data: Record<string, any>;

  customTags: string[];
}
