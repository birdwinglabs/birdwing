import { join, dirname, basename, extname } from 'path';
import { nodes, Plugin } from '@aetlan/aetlan';
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
        url: path,
        nodes,
        tags: [],
        data: async () => frontmatter,
        output: (tag: Tag) => tag,
      }
    })
    .page('**/*.md', ({ frontmatter, path }) => {
      const url = () => {
        if (frontmatter.slug) {
          return join('/', frontmatter.slug);
        }
        let dirName = join('/', dirname(path));

        if (path.endsWith('INDEX.md')) {
          return dirName;
        }

        return join(dirName, basename(path, extname(path)));
      }
      return {
        render: 'Page',
        url: url(),
        nodes,
        tags: ['cta', 'feature'],
        data: async ({ menu }: PageFragments) => ({ ...frontmatter, menu }),
      }
    });
}
