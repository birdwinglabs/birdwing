import path from 'path';

import * as esbuild from 'esbuild'

export interface ThemeBuildOptions {
  minify?: boolean;

  export?: boolean;

  outfile?: string;
}

export function configureTheme(
  root: string, options: ThemeBuildOptions = {}
): esbuild.BuildOptions
{
  return {
    entryPoints: [path.join(root, 'theme/index.ts')],
    format: 'cjs',
    minify: options.minify === true,
    bundle: true,
    outfile: options.outfile || path.join(root, 'out/theme.js'),
    write: false,
  };
}
