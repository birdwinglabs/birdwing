import pb from 'path-browserify';
import { Route, createPlugin, extractHeadings } from '@aetlan/core';
import { extractLinks, makePageData, SummaryPageData } from './summary.js';
import { Tag } from '@markdoc/markdoc';
import { Heading } from '@aetlan/aetlan/dist/util.js';

const { dirname } = pb;

export interface PageAttributes {
  title: string;

  description: string;

  menu?: Tag;

  footer?: Tag;
}

export interface DocPageAttributes extends PageAttributes, SummaryPageData {
  headings: Heading[];

  summary?: Tag;
}

//export class DocRoute extends Route<DocPageAttributes> {
  //constructor(tag: Tag, url: string, private attributes: Partial<DocPageAttributes>) {
    //super(tag, url);
  //}

  //setAttributes(attr: Partial<DocPageAttributes>): void {
    //super.setAttributes({ ...attr, ...this.attributes });
  //}

  //get title() {
    //return this.attributes.title || this.url;
  //}
//}

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
        const links = extractLinks(ast, dirname(path), transformer.urlMap);
        const data = makePageData(links);

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
