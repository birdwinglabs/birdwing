import { join, dirname } from 'path';
import { nodes, Plugin, resolvePageUrl } from '@aetlan/aetlan';
import { feature } from './schema/feature.js';
import { cta } from './schema/cta.js';
import { menu } from './schema/menu.js';
import { page } from './schema/page.js';
import Markdoc from '@markdoc/markdoc';

const { Tag } = Markdoc;

interface PageFragments {
  menu: typeof Tag;
}

export default function pages() {
  return new Plugin()
    .tag('cta', cta)
    .tag('feature', feature)
    .fragment('MENU.md', ({ frontmatter, path }) => ({
      name: 'menu',
      url: join('/', dirname(path)),
      nodes: { ...nodes, document: menu },
      data: async () => frontmatter,
      output: tag => tag,
    }))
    .page('**/*.md', ({ frontmatter, path }) => ({
      url: resolvePageUrl(path, frontmatter.slug),
      nodes: { ...nodes, document: page },
      data: async ({ menu }: PageFragments) => ({ ...frontmatter, menu }),
    }));
}
