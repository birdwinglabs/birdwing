import path from 'path';

import * as esbuild from 'esbuild'
import { Route } from '@birdwing/core';
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';
import { HighlightJsSnippet } from '../snippets/highlightjs.js';

export function configureProducationClient(
  root: string, theme: Theme, routes: Route[], languages: string[]
): esbuild.BuildOptions
{
  const snippets: CodeSnippet[] = [
    new ThemeSnippet(theme),
    new HighlightJsSnippet(languages),
  ];

  const code = `
    import { Renderer, Page as PageWrapper } from '@birdwing/react';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";

    ${snippets.map(s => s.head).join('\n')}
    ${snippets.map(s => s.body).join('\n')}

    const renderer = new Renderer(components);
    const container = document.getElementById('app');

    function ClientRoute() {
      const content = useLoaderData();
      return <PageWrapper renderer={renderer} content={content} highlight={highlight} />;
    }

    function loader(url) {
      if (url.endsWith('/')) {
        return fetch(url + 'data.json');
      } else {
        return fetch(url + '/data.json');
      }
    }

    const router = createBrowserRouter([\n${routes.map(r => {
      return `{ path: '${r.url}', element: <ClientRoute/>, loader: () => loader('${r.url}') }`;
    }).join(',\n')}]);

    ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    logLevel: 'silent',
    minify: true,
    bundle: true,
    outfile: path.join(root, 'out/client.js'),
    write: false,
  };
}
