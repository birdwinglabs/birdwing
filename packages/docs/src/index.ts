import { join, dirname } from 'path';
import { Plugin, extractHeadings, resolvePageUrl } from '@aetlan/aetlan';
import { extractLinks, makePageData, Summary } from './summary.js';
import Markdoc, { Schema } from '@markdoc/markdoc';

const { Tag } = Markdoc;

interface DocsConfig {
  path: string;
}

interface DocFragments {
  docsummary: Summary;

  menu: typeof Tag;
}


const rootPath = 'docs';

export default function() {
  return new Plugin()
    //.tag('hint', {
      //render: 'Hint',
      //attributes: {
        //style: {
          //type: String
        //}
      //},
    //})
    .fragment('docsummary', ({ frontmatter, ast, path }) => {
      return {
        //name: 'summary',
        url: join('/', dirname(path)),
        //nodes: { ...nodes, document: docSummary },
        data: async () => frontmatter,
        output: (tag, {urls}) => {
          const links = extractLinks(ast, rootPath, urls);
          const data = makePageData(links);

          return new Summary(tag, data);
        }
      }
    })
    .page('docpage', ({ frontmatter, path, ast }) => {
      const url = resolvePageUrl(path, frontmatter.slug, rootPath);

      return {
        url,
        //nodes: { ...nodes, document: docPage },
        data: async ({ docsummary, menu }: DocFragments) => ({
          ...docsummary.data(url),
          ...frontmatter,
          headings: extractHeadings(ast),
          summary: docsummary.renderable,
          menu: menu,
        }),
      }
    })
}
