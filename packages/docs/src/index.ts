import { join, dirname } from 'path';
import { Plugin, extractHeadings, resolvePageUrl } from '@aetlan/aetlan';
import { extractLinks, makePageData, Summary } from './summary.js';
import { Tag } from '@markdoc/markdoc';

interface DocFragments {
  docsummary?: Summary;

  menu?: Tag;

  footer?: Tag;
}

export default function() {
  return new Plugin('docs')
    .fragment('docsummary', 'SUMMARY.md', (mountPath, { frontmatter, ast, path }) => {
      return {
        url: join('/', dirname(path)),
        data: async () => frontmatter,
        output: (tag, {urls}) => {
          const links = extractLinks(ast, mountPath, urls);
          const data = makePageData(links);

          return new Summary(tag, data);
        }
      }
    })
    .page('docpage', '**/*.md', (mountPath, { frontmatter, path, ast }) => {
      const url = resolvePageUrl(path, frontmatter.slug, mountPath);

      return {
        url,
        data: async ({ docsummary, footer, menu }: DocFragments) => {
          let data = {
            ...frontmatter,
            menu,
            footer,
            headings: extractHeadings(ast),
          }
          if (docsummary) {
            data = Object.assign({ ...docsummary.data(url), summary: docsummary.renderable }, data);
          }
          return data;
        }
      }
    })
}
