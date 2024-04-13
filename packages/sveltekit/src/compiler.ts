import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vm from 'vm';
import path from 'path';
//import fs from 'fs';
import svelte from 'rollup-plugin-svelte';
//import typescript from '@rollup/plugin-typescript';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

export async function compile(filepath: string, dstRoot: string) {
  const tsconfig = path.join(dstRoot, 'tsconfig.aetlan.json');

  const config: any = {
    input: filepath,
    external: ['svelte/internal'],
    plugins: [
      // @ts-ignore
      svelte({
        compilerOptions: { generate: 'ssr', preserveComments: true },
        onwarn: () => {},
      }),
      nodeResolve({
        moduleDirectories: [path.join(dstRoot, 'node_modules')]
      }),
      commonjs(),
    ],
  }

  //if (fs.existsSync(tsconfig)) {
    //config.plugins.unshift(typescript({}))
  //}

  const bundle = await rollup(config);
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
