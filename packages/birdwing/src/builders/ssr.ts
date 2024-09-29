import path from 'path';

import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';
import { Route } from '@birdwing/core';
import { BundleBuilder } from './bundle.js';
import { Theme } from '../theme.js';

export class SsrBuilder extends BundleBuilder {
  constructor(private theme: Theme) { super(); }

  get code() {
    return `
      import { Routes, Route } from 'react-router-dom';
      import { StaticRouter } from "react-router-dom/server";
      import ReactDOMServer from "react-dom/server";
      import { Renderer, Page as PageWrapper  } from '@birdwing/renderer';
      ${this.theme.componentNames.map(c => `import ${c} from './tags/${c}.jsx';`).join('\n')}

      const components = { ${this.theme.componentNames.map(c => `${c}: new ${c}()`).join(', ')} };
      const renderer = new Renderer(components);

      app = (routes, path) => {
        return ReactDOMServer.renderToString(
          <StaticRouter location={path}>
            <Routes>
              { routes.map(r =>
                <Route key={r.url} path={r.url} element={<PageWrapper renderer={renderer} content={r.tag}/>} />
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
      React,
      app,
    }

    vm.runInNewContext(code, sandbox);
    return sandbox.app;
  }
}
