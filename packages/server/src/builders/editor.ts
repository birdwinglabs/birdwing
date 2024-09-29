import path from 'path';

import * as esbuild from 'esbuild'

export function configureEditor(root: string, files: string[]): esbuild.BuildOptions {
  const imports = files.map(f => {
    const name = path.basename(f, path.extname(f));
    const file = path.relative(path.join(root, 'theme'), f)

    return { name, file };
  });

  const code = `
    import App from '@aetlan/editor';
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { createBrowserRouter, RouterProvider } from "react-router-dom";
    import theme from './theme.config.ts';
    ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

    const components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };

    const container = document.getElementById('app');

    const router = createBrowserRouter([{
      path: '*',
      element: <App components={components} themeConfig={theme}/>
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
