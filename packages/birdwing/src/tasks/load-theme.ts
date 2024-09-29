import path from 'path';
import vm from 'vm';
import { AppConfig } from "@birdwing/core";
import * as esbuild from 'esbuild';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Schema } from '@markdoc/markdoc';
import { ThemeConfig } from '@birdwing/core';
import { Theme } from "../theme.js";
import { Task } from '../command.js';

export class LoadThemeTask extends Task<Theme> {
  constructor(private config: AppConfig, private root: string) {
    super({
      start: 'Loading theme...',
      success: theme => `Loaded theme: ${theme.path}`
    });
  }

  async *execute() {
    const configFile = path.join(this.root, this.config.theme || 'theme', 'theme.config.ts');
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
