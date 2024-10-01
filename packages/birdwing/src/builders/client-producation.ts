import path from 'path';

import * as esbuild from 'esbuild'
import { Route } from '@birdwing/core';
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';
import { HighlightJsSnippet } from '../snippets/highlightjs.js';

export function configureProducationClient(
  root: string, theme: Theme, routes: Route[], languages: string[], js: {url: string, code: string}[]
): esbuild.BuildOptions
{
  const snippets: CodeSnippet[] = [
    new ThemeSnippet(theme),
    new HighlightJsSnippet(languages),
  ];

  const code = `
    import { ProductionPage as PageWrapper } from '@birdwing/react';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";

    const routes = {
      ${js.map(({ url, code }) => `'${url}': ${code}` ).join(',\n')}
    };

    ${snippets.map(s => s.head).join('\n')}
    ${snippets.map(s => s.body).join('\n')}

    const container = document.getElementById('app');

    const namespace = (name) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        return { component: ns[0], node: ns[1] };
      } else {
        return { component: name, node: 'layout' };
      }
    }

    const component = (name) => {
      const ns = namespace(name);
      return (props) => components[ns.component][ns.node](props);
    };

    const router = createBrowserRouter([\n${routes.map(r => {
      return `{
        path: '${r.url}',
        element: <PageWrapper highlight={highlight}>{routes['${r.url}']({ components: component })}</PageWrapper>
      }`;
    }).join(',\n')}]);

    ReactDOM.createRoot(container).render(<RouterProvider router={router} />);
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    //logLevel: 'silent',
    minify: false,
    bundle: true,
    outfile: path.join(root, 'out/client.js'),
    write: false,
  };
}
