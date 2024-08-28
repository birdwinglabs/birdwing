import { SourceDocument } from "./interfaces.js";
import { ContentLoader } from "./loader.js";
import { Compiler, ContentTarget, TransformResult } from "./compiler.js";
import { ContentParser, Store } from "./store.js";
import { DependencyGraph } from "./aetlan.js";
import { Transformer } from "./transformer.js";

export class Pipeline {
  constructor(
    private store: Store,
    private target: ContentTarget,
    private compiler: Compiler,
    private transformer: Transformer,
    private parser: ContentParser,
    private loader: ContentLoader,
    private depGraph: DependencyGraph,
  ) {
    this.store.watch().on('content-changed', async change => {
      this.pushContent(change);
    });
  }

  async pushContent(content: SourceDocument) {
    const parsed = this.parser.parse(content);

    if (!parsed) {
      return;
    }

    if (parsed.type === 'partial') {
      this.transformer.setPartial(parsed.path, parsed.ast);

      const dependants = this.depGraph.dependants(parsed.id);

      for (const doc of dependants) {
        const split = doc.split(':');
        if (split[0] === 'page') {
          this.store.reloadContent(`pages/${split[1]}`);
        }
      }
    }

    const res = parsed.type !== 'partial'
      ? this.compiler.pushNode(this.loader.load(parsed))
      : this.compiler.pushPartial(parsed);

    if (res.changeType === 'attributes') {
      for (const page of res.pages) {
        this.target.mountAttributes(page.url, await page.attributes(res.fragments));
      }
    } else {
      for (const route of await res.compileRoutes()) {
        this.target.mount(route);
      }
    }
  }

  private async handleTransformResult(res: TransformResult) {
    if (res.changeType === 'attributes') {
      for (const page of res.pages) {
        this.target.mountAttributes(page.url, await page.attributes(res.fragments));
      }
    } else {
      for (const route of await res.compileRoutes()) {
        this.target.mount(route);
      }
    }
  }
}
