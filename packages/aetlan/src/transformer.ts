import ev from "eventemitter3";
import Markdoc, { Node, Tag } from "@markdoc/markdoc";
import { Document } from '@tashmet/tashmet';

import { ContentTransform, PageData } from "./interfaces.js";
import { Page, PageFileHandler, RenderablePage } from "./page.js";
import { PageDataLoader } from "./pageDataLoader.js";
import { Fragment, FragmentFileHandler, RenderableFragment } from "./fragment.js";
import { PluginContext } from "./plugin.js";
import { CustomTag } from "./tag.js";

const { EventEmitter } = ev;

export class TransformContext {
  constructor(
    private customTags: Record<string, CustomTag>,
    private urls: Record<string, string>,
  ) {}

  transform(ast: Node, config: ContentTransform, extraVars: Document) {
    const { tags: tagnames, nodes, render } = config;

    const tags = tagnames.reduce((tags, name) => {
      tags[name] = this.customTags[name];
      return tags;
    }, {} as Record<string, CustomTag>);

    const variables = {
      context: render,
      urls: this.urls,
      ...extraVars,
    }

    return {
      tag: Markdoc.transform(ast, { tags, nodes, variables }) as Tag,
      variables,
    }
  }
}

export class Transformer extends EventEmitter {
  private dataLoader: PageDataLoader;

  constructor(
    private pluginContext: PluginContext,
    private urls: Record<string, string>,
    private fragments: Fragment[] = [],
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

    return new Transformer(pluginContext, urls, fragments, pages);
  }

  async pushContent(content: PageData) {
    const handler = this.pluginContext.getFileHandler(content);
    const ctx = new TransformContext(this.pluginContext.tags, this.urls);

    if (handler instanceof PageFileHandler) {
      const page = handler.createPage(content);
      this.emit('page-updated', page.transform(ctx, this.dataLoader));
    }
    
    else if (handler instanceof FragmentFileHandler) {
      const fragment = handler.createFragment(content);

      const updated = this.dataLoader.pushFragment(fragment.transform(ctx));
      if (updated) {
        this.emit('fragment-updated', fragment);
      } else {
        this.emit('fragment-added', fragment);
      }
    }
  }

  transform() {
    const ctx = new TransformContext(this.pluginContext.tags, this.urls);
    const renderablePages: RenderablePage[] = [];
    const renderableFragments: RenderableFragment<any>[] = [];

    for (const fragment of this.fragments) {
      renderableFragments.push(fragment.transform(ctx));
    }
    this.dataLoader = new PageDataLoader(renderableFragments);

    for (const page of this.pages) {
      renderablePages.push(page.transform(ctx, this.dataLoader) );
    }
    return renderablePages;
  }
}
