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
}
