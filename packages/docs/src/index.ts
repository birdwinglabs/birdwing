import { join, dirname } from 'path';
import { Plugin, extractHeadings, nodes, resolvePageUrl } from '@aetlan/aetlan';
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
      const url = resolvePageUrl(path, frontmatter.slug, config.path);

      return {
        render: 'Documentation',
        url,
        nodes,
        tags: ['hint'],
        data: async ({ summary, menu }: DocFragments) => ({
          ...summary.data(url),
          ...frontmatter,
          headings: extractHeadings(ast),
          summary: summary.renderable,
          menu: menu,
        }),
      }
    })
}
