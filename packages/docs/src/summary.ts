import path from 'path';
import { makeNodes } from './nodes/index.js';
import { PageData, Fragment } from '@aetlan/aetlan';
import Markdoc from '@markdoc/markdoc';

export class Summary extends Fragment {
  readonly name = 'summary';

  constructor(
    public readonly renderable: any,
    public readonly path: string,
    private links: any,
    private urls: Record<string, string>
  ) {
    super();
  }

  static fromDocument(page: PageData, rootPath: string, urls: Record<string, string>) {
    let heading: string | undefined;
    let links: any[] = [];

    const renderable = Markdoc.transform(page.ast, {
      tags: {},
      nodes: makeNodes(),
      variables: {
        context: 'DocumentationSummary',
        urls,
        path: rootPath,
      }
    });

    for (const node of page.ast.walk()) {
      switch (node.type) {
        case 'heading':
          for (const child of node.walk()) {
            if (child.type === 'text') {
              heading = child.attributes.content;
            }
          }
          break;
        case 'link':
          const href = node.attributes.href;
          let title = '';
          for (const child of node.walk()) {
            if (child.type === 'text') {
              title = child.attributes.content;
            }
          }
          links.push({ href, title, topic: heading });
          break;
      }
    }

    return new Summary(renderable, rootPath, links, urls);
  }

  topic(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1) {
      return undefined;
    }
    return this.links[idx].topic;
  }

  next(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1 || idx === this.links.length - 1) {
      return undefined;
    }
    const { href, title } = this.links[idx + 1];
    return { href: this.urls[path.join(this.path, href)], title };
  }

  prev(pagePath: string) {
    const idx = this.links.findIndex((link: any) => link.href === pagePath);
    if (idx === -1 || idx === 0) {
      return undefined;
    }
    const { href, title } = this.links[idx - 1];
    return { href: this.urls[path.join(this.path, href)], title };
  }
}
