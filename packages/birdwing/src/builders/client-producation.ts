import path from 'path';

import * as esbuild from 'esbuild'
import { Route } from '@birdwing/core';

export function configureProducationClient(root: string, files: string[], routes: Route[]): esbuild.BuildOptions {
  const imports = files.map(f => {
    const name = path.basename(f, path.extname(f));
    const file = path.relative(path.join(root, 'theme'), f)

    return { name, file };
  });

  const code = `
    import { Renderer, Page as PageWrapper } from '@birdwing/renderer';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider, useLoaderData } from "react-router-dom";
    ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

    const components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };
    const renderer = new Renderer(components);
    const container = document.getElementById('app');

    function ClientRoute() {
      const content = useLoaderData();
      return <PageWrapper renderer={renderer} content={content} />;
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
