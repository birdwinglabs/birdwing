import path from 'path';

export function slugify(id: string, srcPath: string) {
  let slug: string | undefined = path.basename(id, path.extname(id));

  if (id === path.join(srcPath, 'README.md')) {
    slug = '/';
  }
  if (slug === 'README') {
    slug = path.dirname(id).split('/').pop();
  }

  return path.join('/docs', slug || '/');
}

export function* walkMdast(node: any): Generator<any> {
  yield node;
  if (node.children) {
    for (const child of node.children) {
      yield* walkMdast(child);
    }
  }
}

export function extractLinks(slugMap: Record<string, string>, ast: any): any[] {
  let heading: string | undefined;
  let meta: any[] = [];

  for (const node of walkMdast(ast)) {
    switch (node.type) {
      case 'heading':
        heading = node.children[0].value;
        break;
      case 'link':
        const slug = slugMap[node.url];
        meta.push({ slug, title: node.children[0].value, topic: heading });
        break;
    }
  }

  return meta;
}
