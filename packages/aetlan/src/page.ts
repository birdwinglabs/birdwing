import { relative, isAbsolute } from 'path';
import { Node, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';
import { ContentTransform } from "./interfaces.js";
import { Transformer } from './transformer.js';
import { Fragment } from './fragment.js';

export class PageNode {
  constructor(
    private type: string,
    private ast: Node,
    public readonly path: string,
    private config: ContentTransform,
  ) {}

  get url() {
    return this.config.url;
  }

  transform(transformer: Transformer): Page {
    const { tag } = transformer.transform(this.ast, { document: this.type, path: this.path });

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
