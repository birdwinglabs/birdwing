import Tashmet, { Collection } from '@tashmet/tashmet';
import path from 'path';
import { extractLinks, slugify } from './util.js';
import markdoc from '@markdoc/markdoc';
import { makeNodes } from './nodes/index.js';
import { makeTags } from './tags/index.js';
import { RenderableDocument } from '@aetlan/aetlan';
import { DocumentSource } from '@aetlan/aetlan';

interface DocsConfig {
  path: string;
}

export class AetlanDocs implements DocumentSource {
  private source: Collection;

  public constructor(private config: DocsConfig) {}

  async create(name: string, tashmet: Tashmet) {
    this.source = await tashmet.db(name).createCollection('source', {
      storageEngine: {
        glob: {
          pattern: path.join(this.config.path, '**/*.md'),
          format: {
            frontmatter: {
              format: 'yaml',
            }
          },
          construct: {
            path: {
              $relativePath: [this.config.path, '$_id']
            }
          },
          default: {
            'frontmatter.slug': {
              $function: { body: (id: string) => slugify(id, this.config.path), args: [ '$_id' ], lang: 'js' }
            },
          }
        }
      }
    });
  }

  async read(customTags: string[], filePath?: string): Promise<RenderableDocument[]> {
    const slugMap = await this.slugMap();
    const summary = await this.summary();

    if (!summary) {
      throw Error('no summary');
    }

    const links = extractLinks(slugMap, summary.ast);
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

    const headings = (ast: any) => {
      const headings = ast.children
        .filter((node: any) => node.type === 'heading')
        .map((node: any) => ({ depth: node.depth, title: node.children[0].value }));
      return headings;
    }

    const summaryDoc = await this.source.findOne({ path: 'SUMMARY.md' });

    const config = {
      tags: makeTags(customTags),
      nodes: makeNodes(customTags),
    };

    if (!summaryDoc) {
      throw Error('Summary not found');
    }

    const summaryAst = markdoc.parse(summary.body);
    const pathMatch = filePath
      ? filePath
      : { $nin: [ 'SUMMARY.md' ] }

    return this.source.aggregate<RenderableDocument>()
      .match({ path: pathMatch })
      .project({
        _id: 1,
        path: 1,
        body: 1,
        data: {
          $mergeObjects: [
            '$frontmatter', {
              topic: { $function: { body: topic, args: [ '$frontmatter.slug' ], lang: 'js' } },
              prev: { $function: { body: prev, args: [ '$frontmatter.slug' ], lang: 'js' } },
              next: { $function: { body: next, args: [ '$frontmatter.slug' ], lang: 'js' } },
              headings: { $function: { body: headings, args: [{ $markdownToObject: '$body' }], lang: 'js' } },
            }
          ]
        },
        ast: { $markdocToAst: '$body' },
      })
      .set({
        summary: {
          $markdocAstToRenderable: [summaryAst, {
            tags: makeTags(customTags, true),
            nodes: makeNodes(customTags, true),
            variables: { slug: '$data.slug', slugMap },
          }]
        }
      })
      .set({ renderable: { $markdocAstToRenderable: ['$ast', {...config, variables: { nav: '$summary' } }] } })
      .set({ tags: { $function: { body: (node: any) => this.tags(node), args: [ '$renderable' ], lang: 'js' } } })
      .set({ customTags: { $setIntersection: ['$tags', customTags] } })
      .toArray();
  }

  private async summary() {
    return this.source.aggregate([
      { $match: { path: 'SUMMARY.md' } },
      { $set: { ast: { $markdownToObject: '$body' } } },
      { $unset: ['slug'] },
    ]).next();
  }

  private tags(node: any) {
    let result: Set<string> = new Set();
    if (node['$$mdtype'] === 'Tag') {
      result.add(node.name);
    }
    for (const child of node.children || []) {
      if (child['$$mdtype'] === 'Tag') {
        result.add(child.name);
      }
      if (child.children) {
        result = new Set([...Array.from(result), ...this.tags(child)]);
      }
    }
    return Array.from(result);
  }

  private async slugMap() {
    const result = await this.source.aggregate([
      { $project: { _id: 0, k: '$path', v: '$frontmatter.slug' } },
      { $group: { _id: 1, items: { $push: '$$ROOT' } } },
      { $project: { _id: 0, map: { $arrayToObject: '$items' } } },
    ]).next();

    if (!result) {
      throw Error('Unable to read slugs');
    }

    return result.map;
  }
}
