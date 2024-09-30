import path from 'path';

import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Route } from '@birdwing/core';
import { BundleBuilder } from './bundle.js';
import { Theme } from '../theme.js';
import { CodeSnippet } from '../interfaces.js';
import { ThemeSnippet } from '../snippets/theme.js';
import { HighlightJsSnippet } from '../snippets/highlightjs.js';

export class SsrBuilder extends BundleBuilder {
  constructor(private theme: Theme) { super(); }

  get code() {
    const snippets: CodeSnippet[] = [
      new ThemeSnippet(this.theme),
      new HighlightJsSnippet(),
    ];

    return `
      import React from 'react';
      import { Routes, Route } from 'react-router-dom';
      import { StaticRouter } from "react-router-dom/server";
      import ReactDOMServer from "react-dom/server";
      import { Renderer, Page as PageWrapper  } from '@birdwing/react';

      ${snippets.map(s => s.head).join('\n')}
      ${snippets.map(s => s.body).join('\n')}

      const renderer = new Renderer(components);

      app = (routes, path) => {
        return ReactDOMServer.renderToString(
          <StaticRouter location={path}>
            <Routes>
              { routes.map(r =>
                <Route key={r.url} path={r.url} element={<PageWrapper renderer={renderer} content={r.tag} highlight={highlight}/>} />
              )}
            </Routes>
          </StaticRouter>
        );
      }
    `;
  }

  get resolveDir() {
    return this.theme.path;
  }
}

export interface CodeRunner<T> {
  run(code: string): T;
}

export type SsrApp = (routes: Route[], path: string) => string

export class SsrRunner implements CodeRunner<SsrApp> {
  constructor(private console: any) {}

  run(code: string) {
    const app: SsrApp = () => '';

    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console: this.console,
      TextEncoder,
      URL,
      app,
    }

    vm.runInNewContext(code, sandbox);
    return sandbox.app;
  }
}
