import pb from 'path-browserify';
import { Node } from '@markdoc/markdoc';

const { join } = pb;

export interface SummaryLink {
  href: string;
  title: string;
  topic: string | undefined;
}

export interface SummaryPageData {
  title: string;
  topic: string | undefined;
  prev: SummaryLink | undefined;
  next: SummaryLink | undefined;
}

export function makeSummary(ast: Node, basePath: string, urls: Record<string, string>) {
  let heading: string | undefined;
  const links: SummaryLink[] = [];

  for (const node of ast.walk()) {
    switch (node.type) {
      case 'heading':
        for (const child of node.walk()) {
          if (child.type === 'text') {
            heading = child.attributes.content;
          }
        }
        break;
      case 'link':
        const href = urls[join(basePath, node.attributes.href)];
        let title = '';
        for (const child of node.walk()) {
          if (child.type === 'text') {
            title = child.attributes.content;
          }
        }
        links.push({ href, title, topic: heading });
        break;
    }
  }
  const prev = (i: number) => i >= 1 ? links[i - 1] : undefined;
  const next = (i: number) => i < (links.length - 1) ? links[i + 1] : undefined;

  return links.reduce((data, { href, title, topic }, i) => {
    data[href] = { title, topic, prev: prev(i), next: next(i) }
    return data;
  }, {} as Record<string, SummaryPageData>)
}
