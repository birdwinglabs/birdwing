import { dirname } from 'path';
import Markdoc, { Node, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';
import { PageDataLoader } from "./pageDataLoader";
import { ContentTransform, FileHandler, PageData } from "./interfaces";

export class Page {
  constructor(
    private ast: Node,
    public readonly path: string,
    private config: ContentTransform
  ) {}

  get url() {
    return this.config.url;
  }

  async data(fragments: Document) {
    return this.config.data(fragments);
  }

  transform(urls: Record<string, string>, dataLoader: PageDataLoader): RenderablePage {
    const { tags, nodes, render } = this.config;

    const tag = Markdoc.transform(this.ast, {
      tags,
      nodes,
      variables: {
        context: render,
        urls,
        path: this.path,
      }
    }) as Tag;

    return new RenderablePage(this.config.url, tag, () => dataLoader.getData(this));
  }
}


export class PageFileHandler implements FileHandler  {
  constructor(
    public readonly glob: string,
    private config: (doc: PageData) => ContentTransform,
  ) {}

  public createPage(content: PageData) {
    return new Page(content.ast, dirname(content.path), this.config(content));
  }
}

export class RenderablePage {
  constructor(
    public url: string,
    public tag: Tag,
    public attributes: () => Promise<Document>
  ) {}

  async compile(): Promise<Tag> {
    return { ...this.tag, attributes: await this.attributes() };
  }
}
