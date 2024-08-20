import { PageData } from "./interfaces.js";
import { Collection } from "@tashmet/tashmet";
import { ContentLoader } from "./loader.js";
import { Compiler, ContentTarget } from "./compiler.js";

export class Pipeline {
  constructor(
    private source: Collection<PageData>,
    private target: ContentTarget,
    private compiler: Compiler,
    private loader: ContentLoader,
  ) {
    this.source.watch().on('change', async change => {
      if (change.operationType === 'replace' && change.fullDocument) {
        this.pushContent(change.fullDocument);
      }
    });
  }

  async pushContent(content: PageData) {
    const res = this.compiler.pushNode(this.loader.load(content));

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
