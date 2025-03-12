import path from 'path';

import * as esbuild from 'esbuild'
import { Theme } from '../theme.js';

export function configureEditor(root: string, theme: Theme): esbuild.BuildOptions {
  const code = `
    import App from '@birdwing/editor';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import themeConfig from './theme.config.ts';
    import theme from './index.ts';
    import '@birdwing/editor/dist/editor.css';

    const container = document.getElementById('app');

    const router = createBrowserRouter([{
      path: '*',
      element: <App components={theme} themeConfig={themeConfig}/>
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
