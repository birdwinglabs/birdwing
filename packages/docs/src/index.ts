import { join, dirname } from 'path';
import { Plugin, extractHeadings, nodes, resolvePageUrl } from '@aetlan/aetlan';
import { extractLinks, makePageData, Summary } from './summary.js';
import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

interface DocsConfig {
  path: string;
}

interface DocFragments {
  summary: Summary;

  menu: typeof Tag;
}

export const docPage: Schema = {
  render: 'Documentation',
}

export const docSummary: Schema = {
  render: 'DocumentationSummary',
}

export default function(config: DocsConfig) {
  return new Plugin()
    .tag('hint', {
      render: 'Hint',
      attributes: {
        style: {
          type: String
        }
      },
    })
    .fragment(join(config.path, 'SUMMARY.md'), ({ frontmatter, ast, path }) => {
      return {
        name: 'summary',
        url: join('/', dirname(path)),
        nodes: { ...nodes, document: docSummary },
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
        url,
        nodes: { ...nodes, document: docPage },
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
