import * as esbuild from 'esbuild'
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';

export function configureSsr(theme: Theme): esbuild.BuildOptions {
  const snippets: CodeSnippet[] = [
    new ThemeSnippet(theme),
  ];

  const code = `
    import React from 'react';
    import { Routes, Route } from 'react-router-dom';
    import { StaticRouter } from "react-router-dom/server";
    import ReactDOMServer from "react-dom/server";
    import { Content, Page as PageWrapper  } from '@birdwing/react';

    ${snippets.map(s => s.head).join('\n')}
    ${snippets.map(s => s.body).join('\n')}

    app = (routes, path) => {
      return ReactDOMServer.renderToString(
        <StaticRouter location={path}>
          <Routes>
            { routes.map(r =>
              <Route
                key={ r.url }
                path={ r.url }
                element={ <PageWrapper><Content theme={theme} tag={r.tag} /></PageWrapper> }
              />
            )}
          </Routes>
        </StaticRouter>
      );
    }
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: theme.path
    },
    bundle: true,
    //logLevel: 'silent',
    format: 'cjs',
    outfile: 'ssr.js',
    write: false,
  }
}
