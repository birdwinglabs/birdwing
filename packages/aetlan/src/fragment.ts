import { Node } from "@markdoc/markdoc";
import { FragmentConfig, PageData } from "./interfaces.js";
import { Transformer } from './transformer.js';
import { FileHandler } from './loader.js';

export class FragmentNode {
  constructor(
    private ast: Node,
    public readonly path:
    string, private config: FragmentConfig
  ) {}

  get url() {
    return this.config.url;
  }

  transform(transformer: Transformer) {
    const { tag, variables } = transformer.transform(this.ast, this.config, { path: this.path });

    return new Fragment(this.config.name, this.config.url, this.config.output(tag, variables));
  }
}

export class Fragment<T = any> {
  constructor(
    public name: string,
    public url: string,
    public fragment: T,
  ) {}
}

export class FragmentFileHandler implements FileHandler {
  constructor(
    public readonly glob: string,
    private config: (doc: PageData) => FragmentConfig,
  ) {}

  createNode(content: PageData) {
    return new FragmentNode(content.ast, content.path, this.config(content));
  }
}
