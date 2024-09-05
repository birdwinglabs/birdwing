import { createPlugin, Route } from '@aetlan/aetlan';
import { Tag } from '@markdoc/markdoc';

export interface PageAttributes {
  title: string;

  description: string;

  menu?: Tag;

  footer?: Tag;
}

export class PageRoute extends Route<PageAttributes> {
  constructor(tag: Tag, url: string, private attributes: Partial<PageAttributes>) {
    super(tag, url)
  }

  setAttributes(attr: Partial<PageAttributes>): void {
    super.setAttributes({ ...attr, ...this.attributes });
  }
}

const pages = createPlugin<PageRoute>('pages', (transformer, path) => {
  return {
    page: ({ url, ast, frontmatter }) => {
      const tag = transformer.transform(ast, {
        node: 'page',
        variables: { frontmatter, path },
      });
      return new PageRoute(tag, url, frontmatter);
    },
    fragments: {
      menu: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path} });
        return route => route.setAttributes({ menu: tag });
      },
      footer: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'footer', variables: { path } });
        return route => route.setAttributes({ footer: tag });
      }
    }
  }
});

export default pages;
