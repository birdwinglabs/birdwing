import path from 'path';

import * as esbuild from 'esbuild'
import { TargetFile } from '@birdwing/core';
import { Theme } from '../theme.js';

export function configureProducationClient(
  root: string, theme: Theme, staticRoutes: TargetFile[]
): esbuild.BuildOptions
{
  const code = `
    import { Page as PageWrapper } from '@birdwing/react';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";
    import theme from './index.ts';

    const container = document.getElementById('app');

    const router = createBrowserRouter([\n${staticRoutes.map(r => {
      return `{
        path: '${r._id}',
        lazy: async () => {
          const mod = await import('${r._id + '/route.js'}');
          return {
            Component: () => {
              return <PageWrapper>{mod.default({ React, theme })}</PageWrapper>
            }
          }
        }
      }`;
    }).join(',\n')}]);

    ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
  `;

  const files: Record<string, string> = {
    '/client.js': code,
  }

  for (const route of staticRoutes) {
    files[route._id + '/route.js'] = `export default ${route.content}`;
  }

  return {
    entryPoints: Object.keys(files),
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    treeShaking: true,
    metafile: true,
    bundle: true,
    splitting: true,
    format: 'esm',
    outdir: path.join(root, 'out'),
    write: false,
    plugins: [{
      name: 'entry-points',
      setup(build) {
        let filter = new RegExp('^(' + Object.keys(files).join('|') + ')$')
        build.onResolve({ filter }, args => {
          return { path: args.path, namespace: 'entry' }
        })
        build.onLoad({ filter: /.*/, namespace: 'entry' }, args => {
          return { contents: files[args.path], resolveDir: theme.path, loader: 'jsx' }
        })
      },
    }],
  };
}
