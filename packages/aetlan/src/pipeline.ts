import { AbstractDocument, FragmentDocument, PageDocument, PartialDocument, SourceDocument } from "./interfaces.js";
import { Compiler, ContentTarget } from "./compiler.js";
import { Transformer } from "./transformer.js";
import { ContentCache } from "./cache.js";

export class Pipeline {
  constructor(
    private cache: ContentCache,
    private target: ContentTarget,
    private compiler: Compiler,
    private transformer: Transformer,
    //private loader: ContentLoader,
  ) {
    this.cache.watch()
      .on('page-changed', change => {
        this.onPageChanged(change);
      })
      .on('fragment-changed', ({ doc, affected }) => {
        this.onFragmentChanged(doc, affected);
      })
      .on('partial-changed', ({ doc, affected }) => {
        this.onPartialChanged(doc, affected);
      });
  }

  private async onPageChanged(doc: PageDocument) {
    //console.log(`page changed: ${doc.path}`);
    //const res = this.compiler.pushNode(this.loader.load(doc));
    //await this.handleTransformResult(res);
  }

  private async onFragmentChanged(doc: FragmentDocument, affected: PageDocument[]) {
    //console.log(`fragment changed: ${doc.path}`);
    //const res = this.compiler.pushNode(this.loader.load(doc));
    //await this.handleTransformResult(res);
  }

  private async onPartialChanged({path, ast}: PartialDocument, affected: AbstractDocument[]) {
    //console.log(`partial changed: ${path}`);
    this.transformer.setPartial(path, ast);
    //for (const page of affected.filter(doc => doc.type !== 'partial')) {
      //const res = this.compiler.pushNode(this.loader.load(page));
      //await this.handleTransformResult(res);
    //}
  }

  async pushContent(content: SourceDocument) {
    this.cache.update(content);
  }

  //private async handleTransformResult(res: TransformResult) {
    //if (res.changeType === 'attributes') {
      //for (const page of res.pages) {
        //this.target.mountAttributes(page.url, await page.attributes(res.fragments));
      //}
    //} else {
      //for (const route of await res.compileRoutes()) {
        //this.target.mount(route);
      //}
    //}
  //}
}
