import { Document } from '@tashmet/tashmet';
import { Page, PageData, Fragment } from "./interfaces.js";
import ev from "eventemitter3";
import { ContentFactory } from "./contentFactory.js";
import { PageDataLoader } from "./pageDataLoader.js";
import { Tag } from "@markdoc/markdoc";

const { EventEmitter } = ev;

export class RenderablePage {
  static fromPage(page: Page, dataLoader: PageDataLoader, urls: Record<string, string>) {
    return new RenderablePage(
      page.url, page.transform(urls) as Tag, () => dataLoader.getData(page)
    );
  }

  constructor(
    public url: string,
    private tag: Tag,
    private attributes: () => Promise<Document>
  ) {}

  async compile(): Promise<Tag> {
    return { ...this.tag, attributes: await this.attributes() };
  }
}

export class Transformer extends EventEmitter {
  constructor(
    private contentFactory: ContentFactory,
    private urls: Record<string, string>,
    private dataLoader: PageDataLoader,
    private pages: Page[] = [],
  ) {
    super();
  }

  static async initialize(
    content: PageData[],
    contentFactory: ContentFactory,
  ) {
    const pages = await contentFactory.createPages(content);
    const urls = pages.reduce((urls, page) => {
      urls[page.path] = page.url || '';
      return urls;
    }, {} as Record<string, string>);

    const fragments = await contentFactory.createFragments(content, urls);

    return new Transformer(contentFactory, urls, new PageDataLoader(fragments), pages);
  }

  async pushContent(content: PageData) {
    const pageOrFragment = await this.contentFactory.createContent(content, this.urls);

    if (pageOrFragment instanceof Page) {
      const renderable = await this.transformPage(pageOrFragment);
      this.emit('page-updated', renderable);
    } else if (pageOrFragment instanceof Fragment) {
      const updated = this.dataLoader.pushFragment(pageOrFragment);
      if (updated) {
        this.emit('fragment-updated', pageOrFragment);
      } else {
        this.emit('fragment-added', pageOrFragment);
      }
    }
  }

  async transform() {
    const renderables: RenderablePage[] = [];
    for (const page of this.pages) {
      renderables.push(await this.transformPage(page));
    }
    return renderables;
  }

  private async transformPage(page: Page) {
    return RenderablePage.fromPage(page, this.dataLoader, this.urls);
  }
}
