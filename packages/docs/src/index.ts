import pb from 'path-browserify';
import { createPlugin, extractHeadings, Heading } from '@aetlan/core';
import { makeSummary, SummaryPageData } from './summary.js';
import { Tag } from '@markdoc/markdoc';

const { dirname } = pb;

export interface DocPageAttributes extends SummaryPageData {
  title: string;

  description: string;

  headings: Heading[];

  menu?: Tag;

  footer?: Tag;

  summary?: Tag;
}

const docs = createPlugin<DocPageAttributes>('docs', (transformer) => {
  return {
    page: ({ path, url, ast, frontmatter }) => {
      const tag = transformer.transform(ast, {
        node: 'docpage',
        variables: { frontmatter, path },
      });
      Object.assign(tag.attributes, { ...frontmatter, headings: extractHeadings(ast) });

      return { url, title: frontmatter.title, tag };
    },
    fragments: {
      summary: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'summary', variables: { path} });
        const data = makeSummary(ast, dirname(path), transformer.urlMap);

        return route => {
          Object.assign(route.tag.attributes, { summary: tag, ...data[route.url] })
        }
      },
      menu: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path } });
        return route => Object.assign(route.tag.attributes, { menu: tag })
      }
    }
  }
});

export default docs;
