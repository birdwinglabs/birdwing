import { createPlugin, Route, RouteData } from '@birdwing/core';
import { Tag } from '@markdoc/markdoc';

export interface PageData extends RouteData {
  title: string;

  //description: string;

  content: Tag;

  menu?: Tag;

  footer?: Tag;
}

const pages = createPlugin<PageData>('pages', (transformer, path) => {
  return {
    page: ({ id, url, ast, frontmatter }) => {
      const content = transformer.transform(ast, {
        node: 'page',
        variables: { frontmatter, path },
      });
      //content.attributes = frontmatter;

      return { source: id, url, title: frontmatter.title, content };
    },
    fragments: {
      menu: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'menu', variables: { path} });
        return data => {
          data.menu = tag;
        }
      },
      footer: ({ ast }) => {
        const tag = transformer.transform(ast, { node: 'footer', variables: { path } });
        return route => {
          route.footer = tag;
        }
      }
    },
    compile: ({ title, url, source, content, menu, footer }) => {
      const tag = new Tag('document', { typeof: 'Page' }, []);
      const route: Route = { title, url, source, tag };
      
      if (menu) {
        tag.children.push(menu);
      }
      tag.children.push(content);

      if (footer) {
        tag.children.push(footer);
      }

      return route;
    }
  }
});

export default pages;
