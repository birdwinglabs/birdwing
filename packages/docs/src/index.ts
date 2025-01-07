import pb from 'path-browserify';
import { createPlugin, RouteData } from '@birdwing/core';
import { makeSummary, SummaryPageData } from './summary.js';
import { Tag } from '@markdoc/markdoc';

const { dirname } = pb;

export interface DocPage extends RouteData {
  title: string;

  description?: string;

  content: Tag;

  disableNav?: boolean;

  headings?: Tag;

  pagination?: Tag;

  menu?: Tag;

  header?: Tag;

  footer?: Tag;

  summary?: Tag;

  summaryPageData?: SummaryPageData;
}

function createHeader(title: string, topic?: string, description?: string) {
  const header = new Tag('section', { name: 'header' });

  if (topic) {
    header.children.push(
      new Tag('heading', { level: 2, class: 'topic' }, [topic])
    );
  }

  header.children.push(new Tag('heading', { level: 1, class: 'title' }, [title]));

  if (description) {
    header.children.push(new Tag('paragraph', {}, [description]));
  }

  return header;
}

const docs = createPlugin<DocPage>('docs', (transformer) => {
  return {
    page: ({ id, path, url, ast, frontmatter }) => {
      const content = transformer.transform(ast, {
        node: 'doc',
        variables: { frontmatter, path },
      });

      const headings = frontmatter.disableNav
        ? undefined
        : new Tag('section', { name: 'headings' }, content.children.filter(c => c instanceof Tag && c.name === 'heading'));

      return {
        source: id,
        url,
        title: frontmatter.title,
        description: frontmatter.description,
        disableNav: frontmatter.disableNav,
        content,
        headings,
      };
    },
    fragments: {
      summary: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'summary', variables: { path} });
        const data = makeSummary(ast, dirname(path), transformer.urlMap);

        return route => {
          if (data[route.url]) {
            const prev = data[route.url].prev;
            const next = data[route.url].next;
            const topic = data[route.url].topic;

            route.pagination = new Tag('section', { name: 'pagination', class: !prev ? 'first' : !next ? 'last' : undefined }, []);

            if (prev) {
              route.pagination.children.push(new Tag('link', { href: prev.href, class: 'prev' }, [prev.title]));
            }
            if (next) {
              route.pagination.children.push(new Tag('link', { href: next.href, class: 'next' }, [next.title]));
            }
          }

          route.summary = tag;
          route.summaryPageData = data[route.url];
        }
      },
      menu: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path } });
        return route => {
          route.menu = tag;
        }
      }
    },
    compile: ({ title, description, disableNav, url, source, content, menu, footer, summary, pagination, headings, summaryPageData }) => {
      const root = new Tag('DocPage', { title, description, disableNav }, []);

      const header = createHeader(title, summaryPageData?.topic, description);

      root.children = [menu, summary, headings, header, content, pagination, footer]
        .filter(s => s !== undefined);

      return { title, url, source, tag: root };
    }
  }
});

export default docs;
