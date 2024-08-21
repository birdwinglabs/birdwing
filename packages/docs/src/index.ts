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
  children: undefined,
  transform(node, config) {
    const variables = { ...config.variables, context: 'Documentation' };

    return new Tag('Documentation', node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}

export const docSummary: Schema = {
  children: undefined,
  transform(node, config) {
    const variables = { ...config.variables, context: 'DocumentationSummary' };

    return new Tag('DocumentationSummary', node.transformAttributes(config), node.transformChildren({...config, variables }));
  }
}

export default function(config: DocsConfig) {
  return new Plugin()
    .tag('hint', {
      attributes: {
        style: {
          type: String
        }
      },
      transform(node, config) {
        const variables = { ...config.variables, context: 'Hint' };

        return new Tag('Hint', node.transformAttributes(config), node.transformChildren({...config, variables }));
      }
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
