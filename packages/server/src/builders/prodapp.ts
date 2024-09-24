import path from 'path';

import * as esbuild from 'esbuild'

export function configureProdApp(root: string, files: string[]): esbuild.BuildOptions {
  const imports = files.map(f => {
    const name = path.basename(f, path.extname(f));
    const file = path.relative(path.join(root, 'theme'), f)

    return { name, file };
  });

  const code = `
    import { Routes, Route } from 'react-router-dom';
    import { StaticRouter } from "react-router-dom/server";
    import ReactDOMServer from "react-dom/server";
    import { Renderer, Page as PageWrapper  } from '@aetlan/renderer';

    ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

    components = { ${imports.map(({ name }) => `${name}: new ${name}()`).join(', ')} };

    const renderer = new Renderer(components);

    app = (routes, path) => {
      return ReactDOMServer.renderToString(
        <StaticRouter location={path}>
          <Routes>
            { routes.map(r => <Route path={r.url} element={<PageWrapper renderer={renderer} content={r.tag}/>} />)}
          </Routes>
        </StaticRouter>
      );
    }
  `;

  return {
    stdin: {
      contents: code,
      loader: 'jsx',
      resolveDir: path.join(root, 'theme'),
    },
    bundle: true,
    format: 'cjs',
    outfile: 'out.js',
    write: false,
  };
}
