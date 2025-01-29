import path from 'path';

import * as esbuild from 'esbuild'
import { Theme } from '../theme.js';

export interface ThemeBuildOptions {
  minify?: boolean;

  export?: boolean;

  outfile?: string;
}

export function configureTheme(
  root: string, theme: Theme, options: ThemeBuildOptions = {}
): esbuild.BuildOptions
{
  let code = `
    ${theme.componentNames.map(c => `import ${c} from './tags/${c}.jsx';`).join('\n')}
    components = { ${theme.componentNames.map(c => `${c}: new ${c}()`).join(', ')} };
  `;

  if (options.export) {
    code += 'export default components;'
  }

  return {
    entryPoints: [path.join(root, 'theme/tags/index.ts')],
    //loader: 'jsx',
    //stdin: {
      //contents: code,
      //loader: 'jsx',
      //resolveDir: path.join(root, 'theme'),
    //},
    format: 'cjs',
    minify: options.minify === true,
    bundle: true,
    outfile: options.outfile || path.join(root, 'out/theme.js'),
    write: false,
  };
}
