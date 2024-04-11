import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vm from 'vm';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

export async function compile(filepath: string) {
  const bundle = await rollup({
    input: filepath,
    external: ['svelte/internal'],
    plugins: [
      // @ts-ignore
      svelte({
        compilerOptions: { generate: 'ssr', preserveComments: true },
        onwarn: () => {},
      }),
      nodeResolve({
        moduleDirectories: ['/home/bander10/Documents/code/svelte-docs/node_modules']
      }),
      commonjs(),
    ],
  });
  const generated = await bundle.generate({ format: 'cjs', exports: 'default' });
  const code = generated.output[0].code;
  const result = {};
  const bindings = {};

  return (props: any, slots: any) => {
    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console,
      module: {}
    };
    const html = vm
      .runInNewContext(code, sandbox)
      .$$render(result, props, bindings, slots);

    return html;
  }
}
