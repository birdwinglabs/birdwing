import * as esbuild from 'esbuild';
import * as glob from 'glob';
import vm from 'vm';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Schema } from '@markdoc/markdoc';
import { ThemeConfig } from '@aetlan/core';


export class Theme {
  constructor(public readonly path: string, private config: ThemeConfig) {}

  get tags() {
    return this.config.tags;
  }

  get nodes() {
    return this.config.nodes;
  }

  get documents() {
    return this.config.documents;
  }

  get plugins() {
    return this.config.plugins;
  }

  get componentGlob(): string {
    return path.join(this.path, 'tags', '**/*.jsx');
  }

  get jsxGlob(): string {
    return path.join(this.path, '**/*.jsx');
  }

  get componentNames() {
    return glob
      .globSync(this.componentGlob)
      .map(f => path.basename(f, path.extname(f)));
  }

  static async load(configFile: string): Promise<Theme> {
    const themePath = path.dirname(configFile);

    let build = await esbuild.build({
      entryPoints: [configFile],
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

    const { tags, nodes, documents, plugins } = (sandbox as any)['theme'] as ThemeConfig;

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
  
    return new Theme(themePath, { tags, nodes, documents, plugins })
  }
}
