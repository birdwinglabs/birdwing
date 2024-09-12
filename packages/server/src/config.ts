import * as esbuild from 'esbuild';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Schema } from '@markdoc/markdoc';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import { AetlanConfig } from '@aetlan/aetlan';
import { ContentMountPoint, Theme } from '@aetlan/core';

interface ConfigFile {
  theme?: string;

  content: ContentMountPoint[];

  variables: Record<string, any>;
}

export async function loadConfig(file: string): Promise<AetlanConfig> {
  const configFile = yaml.load(fs.readFileSync(file).toString()) as ConfigFile;
  const dirname = path.dirname(file);
  const themePath = path.join(dirname, configFile.theme || 'theme');

  let build = await esbuild.build({
    entryPoints: [path.join(themePath, 'index.ts')],
    bundle: true,
    format: 'cjs',
    outfile: 'theme.js',
    write: false,
  });

  const sandbox = {
    require: createRequire(import.meta.url),
    __dirname: path.dirname(fileURLToPath(import.meta.url)),
    console,
    module: {},
    exports: {},
    components: {},
    TextEncoder,
    URL,
  };

  vm.runInNewContext(build.outputFiles[0].text, sandbox, { });

  const { tags, nodes, documents, plugins } = (sandbox as any)['theme'] as Theme;

  const ensureFunctions = (schema: Schema) => {
    const t = schema.transform;
    const v = schema.validate;
    if (typeof t === 'function') {
      schema.transform = function(...args: any) { return t.apply(schema, args); }
    }
    if (typeof v === 'function') {
      schema.validate = function(...args: any) { return v.apply(schema, args); }
    }
  }

  // This is a bit of a hack to make sure that transform and validate are instanceof Function
  Object.values(tags).forEach(s => ensureFunctions(s));
  Object.values(nodes).forEach(s => ensureFunctions(s));
  Object.values(documents).forEach(s => ensureFunctions(s));

  return {
    tags,
    nodes,
    documents,
    plugins,
    content: configFile.content,
    variables: configFile.variables || {},
  };
}
