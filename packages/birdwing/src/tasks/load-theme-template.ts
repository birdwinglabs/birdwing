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
import { Template } from '@birdwing/react';

export class LoadThemeTemplateTask extends Task<string> {
  constructor(private code: string) {
    super({
      start: 'Loading theme template...',
      success: `Loaded theme template`
    });
  }

  async *execute() {
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

    const res = vm.runInNewContext(this.code, sandbox, {  });

    //console.log((sandbox as any).theme);

    return (sandbox as any).theme;

    //throw new Error('Not implemented yet');
    //const { tags, nodes, documents, plugins } = (sandbox as any)['theme'] as ThemeConfig;

    //const ensureFunctions = (schema: Schema) => {
      //const t = schema.transform;
      //const v = schema.validate;
      //if (typeof t === 'function') {
        //schema.transform = function(...args: any) { return t.apply(schema, args); }
      //}
      //if (typeof v === 'function') {
        //schema.validate = function(...args: any) { return v.apply(schema, args); }
      //}
    //}

    //// This is a bit of a hack to make sure that transform and validate are instanceof Function
    //Object.values(tags).forEach(s => ensureFunctions(s));
    //Object.values(nodes).forEach(s => ensureFunctions(s));
    //Object.values(documents).forEach(s => ensureFunctions(s));
  
    //return new Theme(themePath, { tags, nodes, documents, plugins })
  }
}
