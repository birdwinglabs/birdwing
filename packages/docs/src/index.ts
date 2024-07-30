import path from 'path';
import { extractLinks } from './util.js';
import markdoc from '@markdoc/markdoc';
import { makeNodes } from './nodes/index.js';
import { TransformContext } from '@aetlan/aetlan';
import { DocumentSource } from '@aetlan/aetlan';
import { Hint, Feature } from './tags/index.js';

interface DocsConfig {
  path: string;
}

export class AetlanDocs implements DocumentSource {
  public constructor(private config: DocsConfig) {}

  get path(): string {
    return this.config.path;
  }

  async update(doc: any, context: TransformContext): Promise<void> {
  }

  async transform(context: TransformContext): Promise<void> {
    const summaryDocs = await context
      .findPages({
        'frontmatter.type': 'documentation',
        path: /SUMMARY.md$/
      })
      .toArray();

    for await (const summaryDoc of summaryDocs) {
      const dir = path.dirname(summaryDoc.path);

      const docs = await context.findPages({
        $and: [
          { 'frontmatter.type': 'documentation' },
          { path: { $regex: `^${dir}`} },
          { path: { $ne: `${dir}/SUMMARY.md` } },
        ]
      }).toArray();

      const slugMap = docs.reduce((slugMap, doc) => {
        slugMap[path.relative(dir, doc.path)] = context.slugify(doc);
        return slugMap;
      }, {} as any);

      const links = extractLinks(slugMap, summaryDoc.ast);

      const next = (slug: string) => {
        const idx = links.findIndex(link => link.slug === slug);
        if (idx === -1 || idx === links.length - 1) {
          return undefined;
        }
        const { topic, ...rest } = links[idx + 1];
        return rest;
      }

      const prev = (slug: string) => {
        const idx = links.findIndex(link => link.slug === slug);
        if (idx === -1 || idx === 0) {
          return undefined;
        }
        const { topic, ...rest } = links[idx - 1];
        return rest;
      }

      const topic = (slug: string) => {
        const idx = links.findIndex(link => link.slug === slug);
        if (idx === -1) {
          return undefined;
        }
        return links[idx].topic;
      }

      const config = {
        tags: {
          hint: new Hint(),
          feature: new Feature(),
        },
        nodes: makeNodes(),
        variables: {
          context: 'Documentation',
        }
      };

      const summaryRenderable = markdoc.transform(summaryDoc.ast, {
        tags: {},
        nodes: makeNodes(),
        variables: { slugMap, context: 'DocumentationSummary' },
      });

      for (const doc of docs) {
        const slug = context.slugify(doc);

        const variables: any = {
          context: 'Documentation',
          props: {
            ...doc.frontmatter,
            headings: this.headings(doc.ast),
            topic: topic(slug),
            next: next(slug),
            prev: prev(slug),
          },
          nav: summaryRenderable,
        };

        await context.mount(slug, markdoc.transform(doc.ast, { ...config, variables }));
      }
    }
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
