import { join, dirname, basename, extname, relative } from 'path';
import { Plugin, nodes } from '@aetlan/aetlan';
import { Summary } from './summary.js';
import { Hint } from './tags/index.js';
import { Tag } from '@markdoc/markdoc';

interface DocsConfig {
  path: string;
}

interface DocFragments {
  summary: Summary;

  menu: Tag;
}

export default function(config: DocsConfig) {
  return new Plugin()
    .tag('hint', new Hint())
    .fragment(join(config.path, 'SUMMARY.md'), ({ frontmatter, ast, path }) => {
      return {
        name: 'summary',
        render: 'DocumentationSummary',
        url: join('/', dirname(path)),
        nodes,
        tags: [],
        data: async () => frontmatter,
        output: (tag, variables) => {
          let heading: string | undefined;
          let links: any[] = [];

          for (const node of ast.walk()) {
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

          return new Summary(tag, config.path, links, variables.urls);
        }
      }
    })
    .page(join(config.path, '**/*.md'), ({ frontmatter, path, ast }) => {
      const url = () => {
        if (frontmatter.slug) {
          return join('/', config.path, frontmatter.slug);
        }
        let dirName = join('/', dirname(path));

        return path.endsWith('README.md')
          ? dirName
          : join(dirName, basename(path, extname(path)));
      }

      return {
        render: 'Documentation',
        url: url(),
        nodes,
        tags: ['hint'],
        data: async ({ summary, menu }: DocFragments) => {
          const p = relative(config.path, path);

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

          return {
            ...frontmatter,
            headings,
            topic: summary.topic(p),
            next: summary.next(p),
            prev: summary.prev(p),
            summary: summary.renderable,
            menu: menu,
          }
        }
      }
    })
}
