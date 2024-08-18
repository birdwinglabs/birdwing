import path from 'path';
import { Page, PageData, nodes } from '@aetlan/aetlan';
import { Hint, Feature } from './tags/index.js';
import { Summary } from './summary.js';
import { Menu } from '@aetlan/pages';


interface DocFragments {
  summary: Summary;

  menu: Menu;
}

export class DocPage extends Page {
  context = 'Documentation';
  tags = {
    hint: new Hint(),
    feature: new Feature(),
  };
  nodes = nodes;

  constructor(
    page: PageData,
    path: string,
  ) { super(page, path); }

  get url() {
    if (this.page.frontmatter.slug) {
      return path.join('/', this.root, this.page.frontmatter.slug);
    }
    const relPath = this.page.path;
    let dirName = path.join('/', path.dirname(relPath));

    if (relPath.endsWith('README.md')) {
      return dirName;
    }

    return path.join(dirName, path.basename(relPath, path.extname(relPath)));
  }

  async data({ summary, menu }: DocFragments) {
    const p = path.relative(this.root, this.page.path);

    return {
      ...this.page.frontmatter,
      headings: this.headings,
      topic: summary.topic(p),
      next: summary.next(p),
      prev: summary.prev(p),
      summary: summary.renderable,
      menu: menu.renderable,
    }
  }

  get headings() {
    const headings: any[] = [];
    for (const node of this.page.ast.walk()) {
      if (node.type === 'heading') {
        let title = '';
        for (const child of node.walk()) {
          if (child.type === 'text') {
            title += child.attributes.content;
          }
        }
        headings.push({ depth: node.attributes.level, title });
      }
    }
    return headings;
  }
}
