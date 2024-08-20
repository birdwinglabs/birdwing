import { join, dirname, basename, extname } from 'path';
import { Plugin, nodes } from '@aetlan/aetlan';
import { extractLinks, makePageData, Summary } from './summary.js';
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
        output: (tag, {urls}) => {
          const links = extractLinks(ast, config.path, urls);
          const data = makePageData(links);

          return new Summary(tag, data);
        }
      }
    })
    .page(join(config.path, '**/*.md'), ({ frontmatter, path, ast }) => {
      const dirName = join('/', dirname(path));
      const url = frontmatter.slug
        ? join('/', config.path, frontmatter.slug)
        : basename(path) === 'README.md'
        ? dirName
        : join(dirName, basename(path, extname(path)));

      return {
        render: 'Documentation',
        url,
        nodes,
        tags: ['hint'],
        data: async ({ summary, menu }: DocFragments) => {
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
            ...summary.data(url),
            ...frontmatter,
            headings,
            summary: summary.renderable,
            menu: menu,
          }
        }
      }
    })
}
