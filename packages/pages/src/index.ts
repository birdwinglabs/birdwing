import { join, dirname } from 'path';
import { nodes, Plugin, resolvePageUrl } from '@aetlan/aetlan';
import { Feature } from './tags/feature.js';
import { Cta } from './tags/cta.js';
import { Tag } from '@markdoc/markdoc';

interface PageFragments {
  menu: Tag;
}

export default function pages() {
  return new Plugin()
    .tag('cta', new Cta())
    .tag('feature', new Feature())
    .fragment('MENU.md', ({ frontmatter, path }) => {
      return {
        name: 'menu',
        render: 'Menu',
        url: join('/', dirname(path)),
        nodes,
        tags: [],
        data: async () => frontmatter,
        output: (tag: Tag) => tag,
      }
    })
    .page('**/*.md', ({ frontmatter, path }) => {
      return {
        render: 'Page',
        url: resolvePageUrl(path, frontmatter.slug),
        nodes,
        tags: ['cta', 'feature'],
        data: async ({ menu }: PageFragments) => ({ ...frontmatter, menu }),
      }
    });
}
