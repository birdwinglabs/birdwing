import { Node } from '@markdoc/markdoc';
import { basename, dirname, extname, join } from 'path';

export function resolvePageUrl(path: string, slug?: string, root: string = '/') {
  const dirName = join('/', dirname(path));
  return slug
    ? join('/', root, slug)
    : basename(path) === 'README.md'
    ? dirName
    : join(dirName, basename(path, extname(path)));
}

export interface Heading {
  depth: number;

  title: string;
}

export function extractHeadings(ast: Node): Heading[] {
  const headings: any[] = [];
  for (const node of ast.walk()) {
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
