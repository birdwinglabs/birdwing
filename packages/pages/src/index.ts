import { join, dirname } from 'path';
import { Plugin, resolvePageUrl } from '@aetlan/aetlan';
import { Tag } from '@markdoc/markdoc';

interface PageFragments {
  menu?: Tag;

  footer?: Tag;
}

export default function pages() {
  return new Plugin('pages')
    .fragment('menu', 'MENU.md', (mountPath, { frontmatter, path }) => ({
      url: join('/', dirname(path)),
      data: async () => frontmatter,
      output: tag => tag,
    }))
    .fragment('footer', '**/FOOTER.md', (mountPath, { frontmatter, path }) => ({
      url: join('/', dirname(path)),
      data: async () => frontmatter,
      output: tag => tag,
    }))
    .page('page', '**/*.md', (mountPath, { frontmatter, path }) => ({
      url: resolvePageUrl(path, frontmatter.slug, mountPath),
      data: async ({ menu, footer }: PageFragments) => ({ ...frontmatter, menu, footer }),
    }));
}
