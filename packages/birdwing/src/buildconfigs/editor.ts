import path from 'path';

import * as esbuild from 'esbuild'
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';
//import { HighlightJsSnippet } from '../snippets/highlightjs.js';
import { Theme } from '../theme.js';

export function configureEditor(root: string, theme: Theme): esbuild.BuildOptions {
  const snippets: CodeSnippet[] = [
    new ThemeSnippet(theme),
    //new HighlightJsSnippet(),
  ];

  const code = `
    import App from '@birdwing/editor';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import theme from './theme.config.ts';
    import '@birdwing/editor/dist/editor.css';

    ${snippets.map(s => s.head).join('\n')}
    ${snippets.map(s => s.body).join('\n')}

    const container = document.getElementById('app');

    const router = createBrowserRouter([{
      path: '*',
      element: <App components={components} themeConfig={theme}/>
    }]);

    ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    bundle: true,
    outfile: '/editor.js',
    write: false,
  };
}
