import { createPlugin, Route } from '@aetlan/core';
import { Tag } from '@markdoc/markdoc';

export interface PageAttributes {
  title: string;

  description: string;

  menu?: Tag;

  footer?: Tag;
}

//export class PageRoute extends Route<PageAttributes> {
  //constructor(tag: Tag, url: string, private attributes: Partial<PageAttributes>) {
    //super(tag, url)
  //}

  //setAttributes(attr: Partial<PageAttributes>): void {
    //super.setAttributes({ ...attr, ...this.attributes });
  //}

  //get title() {
    //return this.attributes.title || this.url;
  //}
//}

const pages = createPlugin<PageAttributes>('pages', (transformer, path) => {
  return {
    page: ({ url, ast, frontmatter }) => {
      const tag = transformer.transform(ast, {
        node: 'page',
        variables: { frontmatter, path },
      });
      tag.attributes = frontmatter;

      return { url, title: frontmatter.title, tag };
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
