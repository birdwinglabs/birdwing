import { PageData } from "./interfaces.js";
import { Page, PageFileHandler, RenderablePage } from "./page.js";
import ev from "eventemitter3";
import { PageDataLoader } from "./pageDataLoader.js";
import { Fragment, FragmentFileHandler } from "./fragment.js";
import { PluginContext } from "./plugin.js";

const { EventEmitter } = ev;


export class Transformer extends EventEmitter {
  constructor(
    private pluginContext: PluginContext,
    private urls: Record<string, string>,
    private dataLoader: PageDataLoader,
    private pages: Page[] = [],
  ) {
    super();
  }

  static async initialize(
    content: PageData[],
    pluginContext: PluginContext,
  ) {
    const urls: Record<string, string> = {};
    const pages: Page[] = [];
    const fragments: Fragment[] = [];

    for (const c of content) {
      const handler = pluginContext.getFileHandler(c);
      if (handler instanceof PageFileHandler) {
        const page = handler.createPage(c);
        pages.push(page);
        urls[c.path] = page.url;
      } else if (handler instanceof FragmentFileHandler) {
        fragments.push(handler.createFragment(c));
      }
    }

    return new Transformer(pluginContext, urls, new PageDataLoader(fragments, pluginContext.tags, urls), pages);
  }

  async pushContent(content: PageData) {
    const handler = this.pluginContext.getFileHandler(content);

    if (handler instanceof PageFileHandler) {
      const page = handler.createPage(content);
      this.emit('page-updated', page.transform(this.urls, this.pluginContext.tags, this.dataLoader));
    }
    
    else if (handler instanceof FragmentFileHandler) {
      const fragment = handler.createFragment(content);

      const updated = this.dataLoader.pushFragment(fragment);
      if (updated) {
        this.emit('fragment-updated', fragment);
      } else {
        this.emit('fragment-added', fragment);
      }
    }
  }

  transform() {
    const renderables: RenderablePage[] = [];
    for (const page of this.pages) {
      renderables.push(page.transform(this.urls, this.pluginContext.tags, this.dataLoader) );
    }
    return renderables;
  }
}
