import { createPlugin } from '@birdwing/core';
import { Tag } from '@markdoc/markdoc';

export interface PageAttributes {
  title: string;

  description: string;

  menu?: Tag;

  footer?: Tag;
}

const pages = createPlugin<PageAttributes>('pages', (transformer, path) => {
  return {
    page: ({ id, url, ast, frontmatter }) => {
      const tag = transformer.transform(ast, {
        node: 'page',
        variables: { frontmatter, path },
      });
      tag.attributes = frontmatter;

      return { source: id, url, title: frontmatter.title, tag };
    },
    fragments: {
      menu: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path} });
        return route => Object.assign(route.tag.attributes, { menu: tag });
      },
      footer: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'footer', variables: { path } });
        return route => Object.assign(route.tag.attributes, { footer: tag });
      }
    }
  }
});

export default pages;
