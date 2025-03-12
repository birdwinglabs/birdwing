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
      OuterFunction: Function,
      OuterString: String,
      OuterNumber: Number,
      OuterBoolean: Boolean,
      OuterArray: Array,
      OuterObject: Object,
      URL,
    };

    const code = `
      Object.setPrototypeOf(Function.prototype, OuterFunction.prototype);
      String = OuterString;
      Boolean = OuterBoolean;
      Number = OuterNumber;
      Array = OuterArray;
      Object = OuterObject;
      ${build.outputFiles[0].text}
    `;

    vm.runInNewContext(code, sandbox, {});

    const { tags, nodes, documents, plugins } = (sandbox as any)['theme'] as ThemeConfig;
  
    return new Theme(themePath, { tags, nodes, documents, plugins })
  }
}
