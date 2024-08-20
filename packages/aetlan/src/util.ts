import { basename, dirname, extname, join } from 'path';

export function resolvePageUrl(path: string, slug?: string, root: string = '/') {
  const dirName = join('/', dirname(path));
  return slug
    ? join('/', root, slug)
    : basename(path) === 'README.md'
    ? dirName
    : join(dirName, basename(path, extname(path)));
}
