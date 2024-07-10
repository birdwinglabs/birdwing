import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import vm from 'vm';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';

export async function compile(filepath: string, dstRoot: string) {
  const config: any = {
    input: filepath,
    plugins: [
      nodeResolve({
        extensions: ['.js', '.jsx'],
        moduleDirectories: [path.join(dstRoot, 'node_modules')]
      }),
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        extensions: ['.js', '.jsx']
      }),
      commonjs(),
    ],
  }

  const bundle = await rollup(config);
  const generated = await bundle.generate({ format: 'cjs', exports: 'default' });
  const code = generated.output[0].code;
  const sandbox = {
    require: createRequire(import.meta.url),
    __dirname: path.dirname(fileURLToPath(import.meta.url)),
    console,
    module: {},
    exports: {},
    React,
  };

  const componentClass = vm.runInNewContext(code, sandbox);
  const component = new componentClass();

  return (node: string) => {
    if (typeof component[node] !== 'function') {
      throw Error(`Missing node: '${node}'`);
    }
    return (props: any) => component[node](props);
  }
}
