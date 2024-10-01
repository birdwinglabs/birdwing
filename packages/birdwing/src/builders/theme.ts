import path from 'path';

import * as esbuild from 'esbuild'
import { Route } from '@birdwing/core';
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';
import { HighlightJsSnippet } from '../snippets/highlightjs.js';

export function configureTheme(
  root: string, theme: Theme
): esbuild.BuildOptions
{
  const code = `
    ${theme.componentNames.map(c => `import ${c} from './tags/${c}.jsx';`).join('\n')}
    components = { ${theme.componentNames.map(c => `${c}: new ${c}()`).join(', ')} };
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    minify: false,
    bundle: true,
    outfile: path.join(root, 'out/theme.js'),
    write: false,
  };
}
