import { relative, isAbsolute } from 'path';
import { Node, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';
import { ContentTransform, PageData } from "./interfaces.js";
import { Transformer } from './transformer.js';
import { Fragment } from './fragment.js';
import { FileHandler } from './loader.js';

export class PageNode {
  constructor(
    private ast: Node,
    public readonly path: string,
    private config: ContentTransform
  ) {}

  get url() {
    return this.config.url;
  }

  transform(transformer: Transformer): Page {
    const { tag } = transformer.transform(this.ast, this.config, { path: this.path });

    function isSubPath(dir: string, root: string) {
      const rel = relative(root, dir);
      return dir === root || (rel && !rel.startsWith('..') && !isAbsolute(rel));
    }

    return new Page(this.config.url, tag, async fragments => {
      const f = fragments.reduce((obj, f) => {
        if (isSubPath(this.url, f.url)) {
          obj[f.name] = f.fragment;
        }
        return obj;
      }, {} as Record<string, any>);

      return this.config.data(f);
    });
  }
}


export class PageFileHandler implements FileHandler  {
  constructor(
    public readonly glob: string,
    private config: (doc: PageData) => ContentTransform,
  ) {}

  public createNode(content: PageData) {
    return new PageNode(content.ast, content.path, this.config(content));
  }
}


export class Page {
  constructor(
    public url: string,
    public tag: Tag,
    public attributes: (fragments: Fragment<any>[]) => Promise<Document>
  ) {}

  async compile(fragments: Fragment<any>[]): Promise<Tag> {
    return { ...this.tag, attributes: await this.attributes(fragments) };
  }
}
