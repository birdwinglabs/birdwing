import { createPlugin, RouteData } from '@birdwing/core';
import { makeSummary, SummaryPageData } from './summary.js';
import { Tag } from '@markdoc/markdoc';
import { TagWrapper } from '@birdwing/schema';
import * as renderable from '@birdwing/renderable';

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
  const header = new Tag('header');

  if (topic) {
    header.children.push(
      new Tag('h2', { property: 'topic' }, [topic])
    );
  }

  header.children.push(new Tag('h1', { property: 'name' }, [title]));

  if (description) {
    header.children.push(new Tag('p', { property: 'description' }, [description]));
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
        : new Tag('aside', { property: 'headings', typeof: 'Headings' }, 
            content.children
              .filter(c => c instanceof Tag && ['h1', 'h2'].includes(c.name))
              .map((c => {
                if (c instanceof Tag) {
                  const { attr, id } = c.attributes;
                  return new Tag(c.name, attr, [ new Tag('a', { href: `#${id}` }, c.children)]);
                } else {
                  return c;
                }
              }))
          );

      return {
        source: id,
        url,
        title: frontmatter.title,
        description: frontmatter.description,
        disableNav: frontmatter.disableNav,
        content,
        headings,
        errors: [],
      };
    },
    fragments: {
      summary: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'summary', variables: { path} });
        const toc = new TagWrapper(tag)
          .parseStrict(renderable.schema.TableOfContents, renderable.schema)
          .data;

        const data = makeSummary(toc);

        return route => {
          if (data[route.url]) {
            const prev = data[route.url].prev;
            const next = data[route.url].next;

            route.pagination = new Tag('nav', { typeof: 'SequentialPagination', property: 'pagination' }, []);

            if (prev) {
              route.pagination.children.push(new Tag('a', { href: prev.href, property: 'previousPage' }, [prev.title]));
            }
            if (next) {
              route.pagination.children.push(new Tag('a', { href: next.href, property: 'nextPage' }, [next.title]));
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
    compile: ({ title, description, url, source, content, menu, footer, summary, pagination, headings, summaryPageData }) => {
      const root = new Tag('document', { typeof: 'DocPage', vocab: 'http://birdwing.io/terms/' }, []);

      const header = createHeader(title, summaryPageData?.topic, description);

      content.children = [header, ...content.children];

      root.children = [menu, summary, headings, content, pagination, footer]
        .filter(s => s !== undefined);

      return { title, url, source, tag: root };
    }
  }
});

export default docs;
