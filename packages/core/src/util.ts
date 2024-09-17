import pb from 'path-browserify';
import { Node } from '@markdoc/markdoc';

const { basename, dirname, extname, join, relative, isAbsolute } = pb;

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
  for (const node of ast.children) {
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

export function isSubPath(dir: string, root: string) {
  if (root === '.' || root === '/') {
    return true;
  }
  if (dir.startsWith(`${root}/`)) {
    return true;
  }
  return false;
  //console.log(`${dir}, ${root}`);
  //const rel = relative(root, dir);
  //return dir === root || (rel && !rel.startsWith('..') && !isAbsolute(rel));
}
