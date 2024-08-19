import { dirname } from 'path';
import Markdoc, { Node, Tag } from "@markdoc/markdoc";
import { Document } from "@tashmet/tashmet";
import { PageDataLoader } from "./pageDataLoader.js";
import { FileHandler, FragmentConfig, PageData } from "./interfaces.js";

export class Fragment {
  constructor(private ast: Node, public readonly path: string, private config: FragmentConfig) {

  }

  get name() {
    return this.config.name;
  }

  get url() {
    return this.config.url;
  }

  transform(urls: Record<string, string>, dataLoader: PageDataLoader): any {
    const { tags, nodes, render } = this.config;
    const variables: Document = {
      context: render,
      urls,
      path: this.path,
    };

    const tag = Markdoc.transform(this.ast, { tags, nodes, variables }) as Tag;

    return this.config.output(tag, variables);
  }
}

export class FragmentFileHandler implements FileHandler {
  constructor(
    public readonly glob: string,
    private config: (doc: PageData) => FragmentConfig,
  ) {}

  public createFragment(content: PageData) {
    return new Fragment(content.ast, dirname(content.path), this.config(content));
  }
}
