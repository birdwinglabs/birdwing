import path from 'path';
import { Document, Fence, Heading, Link, List, Page, Paragraph, Plugin } from '@aetlan/aetlan';
import { Feature } from './tags/feature.js';
import { Cta } from './tags/cta.js';


interface PagesConfig {
  path: string;
}

export class AetlanPage extends Page {
  context: 'Page';
  tags = {
    feature: new Feature(),
    cta: new Cta(),
  };
  nodes = {
    document: new Document(),
    paragraph: new Paragraph(),
    fence: new Fence(),
    list: new List(),
    link: new Link(),
    heading: new Heading(),
  };

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
}

export default function pages(config: PagesConfig) {
  return new Plugin()
    .page({ 'frontmatter.type': 'page' }, async doc => new AetlanPage(doc, config.path));
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
