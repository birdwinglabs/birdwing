import { dirname } from 'path';
import { Node } from "@markdoc/markdoc";
import { FileHandler, FragmentConfig, PageData } from "./interfaces.js";
import { TransformContext } from './transformer.js';

export class Fragment {
  constructor(
    private ast: Node,
    public readonly path:
    string, private config: FragmentConfig
  ) {}

  get name() {
    return this.config.name;
  }

  transform(ctx: TransformContext): any {
    const { tag, variables } = ctx.transform(this.ast, this.config, { path: this.path });

    return new RenderableFragment(this.name, this.path, this.config.output(tag, variables));
  }
}

export class RenderableFragment<T> {
  constructor(
    public name: string,
    public path: string,
    public fragment: T,
  ) {}
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
