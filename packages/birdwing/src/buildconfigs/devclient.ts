import path from 'path';

import * as esbuild from 'esbuild'
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';

export function configureDevClient(root: string, theme: Theme): esbuild.BuildOptions {
  const snippets: CodeSnippet[] = [
    //new ThemeSnippet(theme),
    //new HighlightJsSnippet(),
  ];

  const code = `
    import App from '@birdwing/dev';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import theme from './tags';

    ${snippets.map(s => s.head).join('\n')}
    ${snippets.map(s => s.body).join('\n')}

    const container = document.getElementById('app');

    const router = createBrowserRouter([{
      path: '*',
      element: <App theme={theme}/>
    }]);

    ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    logLevel: 'silent',
    minify: false,
    bundle: true,
    outfile: '/dev.js',
    write: false,
  };
}
