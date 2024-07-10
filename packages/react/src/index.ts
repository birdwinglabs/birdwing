import { Target, Transform } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import path from 'path';
import { ReactConfig } from './interfaces.js';
import React from 'react';
import { renderToString } from 'react-dom/server';
import markdoc from '@markdoc/markdoc';
import fs from 'fs';

export class ReactTarget implements Target {
  private components: Record<string, any> = {};

  constructor(
    private config: ReactConfig
  ) {}

  async component(name: string, filePath: string) {
    this.components[name] = await compile(filePath, this.config.path);
  }

  get transforms(): Record<string, Transform> {
    return {
      'html': async doc => {
        const { data, renderable } = doc;

        const namespace = (name: string) => {
          if (name.includes('.')) {
            const ns = name.split('.');
            return { component: ns[0], node: ns[1] };
          } else {
            return { component: name, node: 'layout' };
          }
        }

        const result = markdoc.renderers.react(renderable, React, { components: (name: string) => {
          const ns = namespace(name);
          return this.components[ns.component](ns.node);
        }});

        const body = renderToString(result);
        const template = fs.readFileSync(path.join(this.config.path, 'src/main.html')).toString();
        const html = template.replace(/{{ CONTENT }}/, body);

        let slug = data.slug;
        if (slug[slug.length - 1] === '/') {
          slug = slug + 'index';
        }

        return {
          path: path.join(this.config.path, 'out', slug + '.html'),
          content: html,
        }
      },
    }
  }
}

export default function react(config: ReactConfig) {
  return new ReactTarget(config);
}
