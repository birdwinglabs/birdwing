import path from 'path';

import * as esbuild from 'esbuild'
import sveltePlugin from 'esbuild-svelte';


export async function buildSvelteApp(root: string, files: string[], tagnamePrefix: string) {
  function camelCaseToDash (str: string) {
    return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
  }

  const imports = files.map(f => {
    const name = path.basename(f, path.extname(f));
    const file = path.relative(path.join(root, 'theme'), f)

    return { name, file, tagname: `${tagnamePrefix}-${camelCaseToDash(name)}` };
  });

  const code = `
    import svelteRetag from 'svelte-retag';
    ${imports.map(({ name, file}) => `import ${name} from './${file}';`).join('\n')}

    ${imports.map(({ name, tagname }) => `
      svelteRetag({
        component: ${name},
        tagname: '${tagname}',
        attributes: true,
        shadow: false,
      }); 
    `).join('\n')}
  `;

  let build = await esbuild.build({
    stdin: {
      contents: code,
      resolveDir: path.join(root, 'theme'),
    },
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: 'client.js',
    write: false,
    plugins: [
      sveltePlugin({
        compilerOptions: { customElement: true }
      })
    ],
  });

  if (build.outputFiles)
    return build.outputFiles[0].text;
  else
    return null;
}
