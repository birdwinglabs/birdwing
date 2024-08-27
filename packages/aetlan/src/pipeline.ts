import { SourceDocument } from "./interfaces.js";
import { ContentLoader } from "./loader.js";
import { Compiler, ContentTarget } from "./compiler.js";
import { ContentParser, Store } from "./store.js";

export class Pipeline {
  constructor(
    private store: Store,
    private target: ContentTarget,
    private compiler: Compiler,
    private parser: ContentParser,
    private loader: ContentLoader,
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
}
