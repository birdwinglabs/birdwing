import vm from 'vm';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import React from 'react';
import * as esbuild from 'esbuild'

export async function compile(filepath: string, dstRoot: string) {
  const result = await esbuild.build({
    entryPoints: [filepath],
    bundle: true,
    format: 'cjs',
    outfile: 'out.js',
    write: false,
  })
  const code = result.outputFiles[0].text;

  const sandbox = {
    require: createRequire(import.meta.url),
    __dirname: path.dirname(fileURLToPath(import.meta.url)),
    console,
    module: {},
    exports: {},
    React,
  };

  console.log(vm.runInNewContext(code, sandbox));

  const componentClass = vm.runInNewContext(code, sandbox).default;
  const component = new componentClass();

  return (node: string) => {
    if (typeof component[node] !== 'function') {
      throw Error(`Missing node: '${node}'`);
    }
    return (props: any) => component[node](props);
  }
}
