import path from 'path';
import { Document, Fence, Heading, Link, List, Paragraph, TransformContext } from '@aetlan/aetlan';
import { DocumentSource } from '@aetlan/aetlan';
import { Feature } from './tags/feature.js';
import { Cta } from './tags/cta.js';
import markdoc, { RenderableTreeNode } from '@markdoc/markdoc';

const { Tag } = markdoc;

interface PagesConfig {
  path: string;
}

export class AetlanPages implements DocumentSource {
  private markdocConfig: any = {
    tags: {
      feature: new Feature(),
      cta: new Cta(),
    },
    nodes: {
      document: new Document(),
      paragraph: new Paragraph(),
      fence: new Fence(),
      list: new List(),
      link: new Link(),
      heading: new Heading(),
    }
  }

  public constructor(private config: PagesConfig) {}

  get path(): string {
    return this.config.path;
  }

  url(page: any) {
    if (page.frontmatter.slug) {
      return path.join(this.path, page.frontmatter.slug);
    }
    const relPath = page.path;
    let dirName = path.join('/', path.dirname(relPath));

    if (relPath.endsWith('INDEX.md')) {
      return dirName;
    }

    return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  }

  async data(page: any) {
    return page.frontmatter;
  }

  async transform(doc: any): Promise<RenderableTreeNode> {
    const variables = { context: 'Page' };
    return markdoc.transform(doc.ast, { ...this.markdocConfig, variables });
  }

  private componentNames(tag: any): string[] {
    let tagNames: string[] = [];

    if (tag instanceof Tag) {
      if (!tag.name.includes('.') && tag.name.toLowerCase() !== tag.name) {
        tagNames.push(tag.name);
      }
      tag.children.map((c: any) => {
        tagNames.push(...this.componentNames(c));
      });
    }

    return Array.from(new Set<string>(tagNames));
  }
}
