import path from 'path';
import { nodes, Page, Plugin } from '@aetlan/aetlan';
import { Feature } from './tags/feature.js';
import { Cta } from './tags/cta.js';
import { Menu } from './menu.js';

export { Menu };

interface PageFragments {
  menu: Menu;
}

export class AetlanPage extends Page {
  context = 'Page';
  tags = {
    feature: new Feature(),
    cta: new Cta(),
  };
  nodes = nodes;

  get url(): string {
    if (this.page.frontmatter.slug) {
      return path.join(this.root, this.page.frontmatter.slug);
    }
    const relPath = this.page.path;
    let dirName = path.join('/', path.dirname(relPath));

    if (relPath.endsWith('INDEX.md')) {
      return dirName;
    }

    return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  }

  async data({ menu }: PageFragments) {
    return {
      ...this.page.frontmatter,
      menu: menu.renderable
    };
  }
}

export default function pages() {
  return new Plugin()
    .fragment('MENU.md', async (doc, urls) => Menu.fromDocument(doc, urls))
    .page('**/*.md', async doc => new AetlanPage(doc, '/'));
}

  //private componentNames(tag: any): string[] {
    //let tagNames: string[] = [];

    //if (tag instanceof Tag) {
      //if (!tag.name.includes('.') && tag.name.toLowerCase() !== tag.name) {
        //tagNames.push(tag.name);
      //}
      //tag.children.map((c: any) => {
        //tagNames.push(...this.componentNames(c));
      //});
    //}

    //return Array.from(new Set<string>(tagNames));
  //}
