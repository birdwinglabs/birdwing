import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import Tashmet, { Collection, Document } from '@tashmet/tashmet';
import { Logger } from '@tashmet/core';
import { terminal } from '@tashmet/terminal';
import path from 'path';
import { extractLinks, slugify } from './util.js';
import markdoc from './markdoc.js';


export class Aetlan {
  static async connect(srcPath: string) {
    const store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdoc())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());

    await tashmet.db('source').createCollection('docs', {
      storageEngine: {
        glob: {
          pattern: path.join(srcPath, '**/*.md'),
          format: {
            frontmatter: {
              format: 'yaml',
            }
          },
          construct: {
            path: {
              $relativePath: [srcPath, '$_id']
            }
          },
          default: {
            'frontmatter.slug': { $function: { body: (id: string) => slugify(id, srcPath), args: [ '$_id' ], lang: 'js' } },
          }
        }
      }
    });

    return new Aetlan(tashmet, store.logger, srcPath);
  }

  private docs: Collection;

  constructor(
    public readonly tashmet: Tashmet,
    public readonly logger: Logger,
    public readonly srcPath: string
  ) {
    this.docs = tashmet.db('source').collection('docs');
  }

  async summary() {
    return this.docs.aggregate([
      { $match: { path: 'SUMMARY.md' } },
      { $set: { ast: { $markdownToObject: '$body' } } },
      { $unset: ['slug'] },
    ]).next();
  }

  async slugMap() {
    const result = await this.docs.aggregate([
      { $project: { _id: 0, k: '$path', v: '$frontmatter.slug' } },
      { $group: { _id: 1, items: { $push: '$$ROOT' } } },
      { $project: { _id: 0, map: { $arrayToObject: '$items' } } },
    ]).next();

    if (!result) {
      throw Error('Unable to read slugs');
    }

    return result.map;
  }

  async documents(pipeline: Document[] = []) {
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

    return this.docs.aggregate([
      { $match: { path: { $nin: [ 'SUMMARY.md' ] } } },
      {
        $project: {
          path: 0,
          topic: { $function: { body: topic, args: [ '$frontmatter.slug' ], lang: 'js' } },
          prev: { $function: { body: prev, args: [ '$frontmatter.slug' ], lang: 'js' } },
          next: { $function: { body: next, args: [ '$frontmatter.slug' ], lang: 'js' } },
          headings: { $function: { body: headings, args: [{ $markdownToObject: '$body' }], lang: 'js' } },
          ast: { $markdocToAst: '$body' },
        }
      },
      {
        $set: {
          renderable: { $markdocAstToRenderable: ['$ast', {}] }
        }
      },
      ...pipeline
    ]).toArray();
  }
}
