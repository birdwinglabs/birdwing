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
import { compile, render } from './renderer.js';

const summaryConfig: any = {
  nodes: {
    document: {
      render: 'SideNav',
      attributes: {
        slug: 'String',
      },
      transform(node: any, config: any) {
        return new markdoc.Tag(this.render, { slug: "/docs/slug" }, node.transformChildren(config));
      }
    },
    list: {
      render: 'Menu',
    },
    item: {
      render: 'MenuItem',
    }
  },
}


export class Aetlan {
  static async connect(srcPath: string) {
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
      tags: {
        hint: {
          render: 'Hint',
          attributes: {
            style: {
              type: 'String'
            }
          },
        }
      },
      nodes: {
        fence: {
          render: 'Fence',
          attributes: {
            content: {
              type: 'String'
            },
            language: {
              type: 'String'
            },
            process: {
              type: 'Boolean'
            }
          },
          //transform(node: any, config: any) {
            //return new markdoc.Tag(this.render, { content: node }, []);
          //}
        }
      },
    }


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

    return new Aetlan(tashmet, store.logger, srcPath, config);
  }

  private docs: Collection;

  constructor(
    public readonly tashmet: Tashmet,
    public readonly logger: Logger,
    public readonly srcPath: string,
    public readonly config: any,
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

    const t: any = {
      Hint: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Hint.svelte'),
      Fence: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Fence.svelte'),
    }

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

    const tags = (node: any) => {
      let result: Set<string> = new Set();
      if (node['$$mdtype'] === 'Tag') {
        result.add(node.name);
      }
      for (const child of node.children || []) {
        if (child['$$mdtype'] === 'Tag') {
          result.add(child.name);
        }
        if (child.children) {
          result = new Set([...Array.from(result), ...tags(child)]);
        }
      }
      return Array.from(result);
    }

    const customTags = (tags: string[]) => {
      const custom = ['Hint', 'Fence', 'SideNav', 'Menu', 'MenuItem'];

      return tags.filter(value => custom.includes(value));
    }

    return this.docs.aggregate([
      //{ $match: { path: { $nin: [ 'SUMMARY.md' ] } } },
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
          renderable: {
            $markdocAstToRenderable: ['$ast', {
              $cond: {
                if: { $eq: ['$path', 'SUMMARY.md']},
                then: summaryConfig,
                else: this.config
              }
            }]
          }
        }
      },
      {
        $set: {
          html: { $function: { body: render, args: ['$renderable', t], lang: 'js' } }
        }
      },
      {
        $set: {
          tags: { $function: { body: tags, args: [ '$renderable' ], lang: 'js' } },
        }
      },
      {
        $set: {
          customTags: { $function: { body: customTags, args: [ '$tags' ], lang: 'js' }}
        }
      },
      ...pipeline
    ]).toArray();
  }
}
