import { Route, createPlugin, extractHeadings } from '@aetlan/aetlan';
import { extractLinks, makePageData, SummaryPageData } from './summary.js';
import { Tag } from '@markdoc/markdoc';
import { Heading } from '@aetlan/aetlan/dist/util.js';
import { dirname } from 'path';

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

export class DocRoute extends Route<DocPageAttributes> {
  constructor(tag: Tag, url: string, private attributes: Partial<DocPageAttributes>) {
    super(tag, url)
  }

  setAttributes(attr: Partial<DocPageAttributes>): void {
    super.setAttributes({ ...attr, ...this.attributes });
  }
}

const docs = createPlugin<DocRoute>('docs', (transformer) => {
  return {
    page: ({ path, url, ast, frontmatter }) => {
      const tag = transformer.transform(ast, {
        node: 'docpage',
        variables: { frontmatter, path },
      });
      return new DocRoute(tag, url, {
        ...frontmatter,
        headings: extractHeadings(ast),
      });
    },
    fragments: {
      summary: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'summary', variables: { path} });
        const links = extractLinks(ast, dirname(path), transformer.urlMap);
        const data = makePageData(links);

        return route => {
          route.setAttributes({ summary: tag, ...data[route.url] });
        }
      },
      menu: ({ path, ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path } });
        return route => route.setAttributes({ menu: tag });
      }
    }
  }
});

export default docs;

//export default function() {
  //return new Plugin('docs')
    //.fragment('docsummary', 'SUMMARY.md', (mountPath, { frontmatter, ast, path }) => {
      //return {
        //url: join('/', dirname(path)),
        //data: async () => frontmatter,
        //output: (tag, {urls}) => {
          //const links = extractLinks(ast, mountPath, urls);
          //const data = makePageData(links);

          //return new Summary(tag, data);
        //}
      //}
    //})
    //.page('docpage', '**/*.md', (mountPath, { frontmatter, path, ast }) => {
      //const url = resolvePageUrl(path, frontmatter.slug, mountPath);

      //return {
        //url,
        //data: async ({ docsummary, footer, menu }: DocFragments) => {
          //let data = {
            //...frontmatter,
            //menu,
            //footer,
            //headings: extractHeadings(ast),
          //}
          //if (docsummary) {
            //data = Object.assign({ ...docsummary.data(url), summary: docsummary.renderable }, data);
          //}
          //return data;
        //}
      //}
    //})
//}
