import { Node } from "@markdoc/markdoc";
import { FragmentConfig } from "./interfaces.js";
import { Transformer } from './transformer.js';

export class FragmentNode {
  constructor(
    private type: string,
    private ast: Node,
    public readonly path: string,
    private config: FragmentConfig
  ) {}

  get url() {
    return this.config.url;
  }

  transform(transformer: Transformer) {
    const { tag, variables } = transformer.transform(this.ast, { document: this.type, path: this.path });

    return new Fragment(this.type, this.config.url, this.config.output(tag, variables));
  }
}

export class Fragment<T = any> {
  constructor(
    public name: string,
    public url: string,
    public fragment: T,
  ) {}
}
