import { Document, Fence, Heading, Link, List, Paragraph, TransformContext } from '@aetlan/aetlan';
import { DocumentSource } from '@aetlan/aetlan';
import { Feature } from './tags/feature.js';
import { Cta } from './tags/cta.js';
import markdoc from '@markdoc/markdoc';

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

  async transform(context: TransformContext): Promise<void> {
    for await (const doc of context.findPages({'frontmatter.type': 'page'})) {
      await this.update(doc, context);
    }
  }

  async update(doc: any, context: TransformContext) {
    const variables = { context: 'Page', props: doc.frontmatter };
    const renderable = markdoc.transform(doc.ast, { ...this.markdocConfig, variables });

    await context.mount(context.slugify(doc), renderable);
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
