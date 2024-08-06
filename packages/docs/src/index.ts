import path from 'path';
import { extractLinks } from './util.js';
import markdoc, { RenderableTreeNode } from '@markdoc/markdoc';
import { makeNodes } from './nodes/index.js';
import { TransformContext } from '@aetlan/aetlan';
import { DocumentSource } from '@aetlan/aetlan';
import { Hint, Feature } from './tags/index.js';

interface DocsConfig {
  path: string;
}

class Links {
  constructor(
    private links: any,
    private rootPath: string,
    private pagePath: string,
    private urls: Record<string, string>
  ) {}

  get topic() {
    const idx = this.links.findIndex((link: any) => link.href === this.pagePath);
    if (idx === -1) {
      return undefined;
    }
    return this.links[idx].topic;
  }

  get next() {
    const idx = this.links.findIndex((link: any) => link.href === this.pagePath);
    if (idx === -1 || idx === this.links.length - 1) {
      return undefined;
    }
    const { href, title } = this.links[idx + 1];
    return { href: this.urls[path.join(this.rootPath, href)], title };
  }

  get prev() {
    const idx = this.links.findIndex((link: any) => link.href === this.pagePath);
    if (idx === -1 || idx === 0) {
      return undefined;
    }
    const { href, title } = this.links[idx - 1];
    return { href: this.urls[path.join(this.rootPath, href)], title };
  }
}

export class AetlanDocs implements DocumentSource {
  private links: any = undefined;

  public constructor(private config: DocsConfig) {}

  get path(): string {
    return this.config.path;
  }

  url(page: any) {
    if (page.frontmatter.slug) {
      return path.join('/', this.path, page.frontmatter.slug);
    }
    const relPath = page.path;
    let dirName = path.join('/', path.dirname(relPath));

    if (relPath.endsWith('README.md')) {
      return dirName;
    }

    return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  }

  async data(page: any, context: TransformContext) {
    let summary: any = undefined;
    summary = await context.findPages({ path: path.join(this.path, 'SUMMARY.md') }).next();
    if (summary && !this.links) {
      this.links = extractLinks(summary.ast);
    }

    const links = new Links(this.links, this.path, path.relative(this.path, page.path), context.urls);

    return {
      ...page.frontmatter,
      headings: this.headings(page.ast),
      topic: links.topic,
      next: links.next,
      prev: links.prev,
      summary: summary ? summary.renderable : undefined,
    }
  }

  async transform(page: any, urls: Record<string, string>): Promise<RenderableTreeNode> {
    if (path.basename(page.path) === 'SUMMARY.md') {
      return markdoc.transform(page.ast, {
        tags: {},
        nodes: makeNodes(),
        variables: {
          context: 'DocumentationSummary',
          urls,
          path: this.path,
        }
      });
    }
    
    return markdoc.transform(page.ast, {
      tags: {
        hint: new Hint(),
        feature: new Feature(),
      },
      nodes: makeNodes(),
      variables: {
        context: 'Documentation',
        urls,
        path: this.path,
      }
    });
  }

  private headings(ast: any) {
    const headings: any[] = [];
    for (const node of ast.walk()) {
      if (node.type === 'heading') {
        let title = '';
        for (const child of node.walk()) {
          if (child.type === 'text') {
            title += child.attributes.content;
          }
        }
        headings.push({ depth: node.attributes.level, title });
      }
    }
    return headings;
  }
}
