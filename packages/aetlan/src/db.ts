import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import Tashmet, { Collection, Document } from '@tashmet/tashmet';
import { Logger } from '@tashmet/core';
import { terminal } from '@tashmet/terminal';
import path from 'path';
import { extractLinks, slugify } from './util.js';
import markdocPlugin from './markdoc.js';
import mustache from './mustache.js';
import markdoc from '@markdoc/markdoc';
import { makeNodes } from './nodes/index.js';
import { makeTags } from './tags/index.js';
import chokidar from 'chokidar';

export class Aetlan {
  static async connect(srcPath: string, customTags: string[] = []) {
    const store = Nabu
      .configure({
        logLevel: LogLevel.Info,
        logFormat: terminal(),
      })
      .use(mingo())
      .use(markdocPlugin())
      .use(mustache())
      .bootstrap();

    const config: any = {
      tags: makeTags(customTags),
      nodes: makeNodes(customTags),
    };

    const tashmet = await Tashmet.connect(store.proxy());

    await tashmet.db('docs').createCollection('source', {
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

    return new Aetlan(tashmet, store.logger, srcPath, config, customTags);
  }

  private docs: Collection;
  private output: Collection;
  private transforms: Record<string, (doc: Document) => Promise<Document>> = {};

  constructor(
    public readonly tashmet: Tashmet,
    public readonly logger: Logger,
    public readonly srcPath: string,
    public readonly config: any,
    public readonly customTags: string[],
  ) {
    this.docs = tashmet.db('docs').collection('source');
  }

  async summary() {
    return this.docs.aggregate([
      { $match: { path: 'SUMMARY.md' } },
      { $set: { ast: { $markdownToObject: '$body' } } },
      { $unset: ['slug'] },
    ]).next();
  }

  tags(node: any) {
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

  transformDocument(name: string, transformer: (doc: Document) => Promise<Document>) {
    this.transforms[name] = transformer;
  }

  async build() {
    this.output = await this.tashmet.db('docs').createCollection('output');
    const docs = await this.documents();
    await this.transform(docs);
  }

  async transform(docs: Document[]) {
    await this.output.deleteMany({});

    for (const [name, t] of Object.entries(this.transforms)) {
      for (const doc of docs) {
        const res = await t(doc);
        await this.output.insertOne({...res, scope: name});
      }
    }

    await this.output.aggregate([
      { $sort: { scope: 1 } },
      { $log: { scope: '$scope', message: '$_id' } },
      {
        $writeFile: {
          content: '$content',
          to: '$_id',
        }
      }
    ]).toArray();
  }

  async watch() {
    this.output = await this.tashmet.db('docs').createCollection('output');
    const watcher = chokidar.watch(path.join(this.srcPath, '**/*.md'));

    watcher.on('change', async filePath => {
      const relPath = path.relative(this.srcPath, filePath);
      const docs = await this.documents(relPath);
      await this.transform(docs);
    });
  }

  async documents(filePath?: string) {
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

    const summaryDoc = await this.docs.findOne({ path: 'SUMMARY.md' });

    if (!summaryDoc) {
      throw Error('Summary not found');
    }

    const summaryAst = markdoc.parse(summary.body);
    const pathMatch = filePath
      ? filePath
      : { $nin: [ 'SUMMARY.md' ] }

    return this.docs.aggregate([
      {
        $match: { path: pathMatch }
      },
      {
        $project: {
          _id: 1,
          path: 1,
          body: 1,
          frontmatter: 1,
          topic: { $function: { body: topic, args: [ '$frontmatter.slug' ], lang: 'js' } },
          prev: { $function: { body: prev, args: [ '$frontmatter.slug' ], lang: 'js' } },
          next: { $function: { body: next, args: [ '$frontmatter.slug' ], lang: 'js' } },
          headings: { $function: { body: headings, args: [{ $markdownToObject: '$body' }], lang: 'js' } },
          ast: { $markdocToAst: '$body' },
        }
      },
      {
        $set: {
          summary: {
            ast: summaryAst,
            renderable: {
              $markdocAstToRenderable: [summaryAst, {
                tags: makeTags(this.customTags, true),
                nodes: makeNodes(this.customTags, true),
                variables: { slug: '$frontmatter.slug', slugMap },
              }]
            }
          }
        }
      },
      {
        $set: {
          renderable: {
            $markdocAstToRenderable: ['$ast', this.config]
          }
        }
      },
      {
        $set: {
          tags: { 
            $concatArrays: [
              { $function: { body: (node: any) => this.tags(node), args: [ '$renderable' ], lang: 'js' } },
              { $function: { body: (node: any) => this.tags(node), args: [ '$summary.renderable' ], lang: 'js' } },
            ]
          },
        }
      },
      {
        $set: {
          customTags: { $setIntersection: ['$tags', this.customTags] }
        }
      },
    ]).toArray();
  }
}
