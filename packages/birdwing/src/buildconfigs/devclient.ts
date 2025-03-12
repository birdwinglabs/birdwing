import path from 'path';

import * as esbuild from 'esbuild'

export function configureDevClient(root: string): esbuild.BuildOptions {
  const code = `
    import App from '@birdwing/dev';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import theme from './index.ts';

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
