import * as glob from 'glob';
import path from 'path';
import { ThemeConfig } from '@birdwing/core';


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

  get jsxGlob(): string {
    return path.join(this.path, '**/*.{jsx,tsx,js,ts}');
  }
}
