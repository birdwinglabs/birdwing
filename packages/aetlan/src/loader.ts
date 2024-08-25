import minimatch from 'minimatch';
import { join } from 'path';
import { ParsedDocument } from "./interfaces.js";
import { Page } from "./page.js";
import { Fragment } from "./fragment.js";
import { Transformer } from "./transformer.js";
import { Plugin } from './plugin.js';

export interface FileNode {
  path: string;

  url: string;

  transform(transformer: Transformer): Page | Fragment;
}

export interface FileHandlerConfig {
  name: string;

  type: 'page' | 'fragment';

  match: string;

  handler: FileHandler;
}

export type FileHandler = (mountPath: string, content: ParsedDocument) => FileNode;

export interface FileMatcher {
  type: string;

  match: string;

  handler: (content: ParsedDocument) => FileNode;
}

export interface ContentMountPoint {
  plugin: string;

  path: string;
}

export class ContentLoader {
  constructor(
    private matchers: FileMatcher[],
  ) {}

  static configure(plugins: Plugin[], mountPoints: ContentMountPoint[]) {
    const matchers: FileMatcher[] = [];

    const pluginMap = plugins.reduce((map, plugin) => {
      map[plugin.name] = plugin;
      return map;
    }, {} as Record<string, Plugin>);

    for (const mp of mountPoints) {
      const fragments = pluginMap[mp.plugin].handlers.filter(h => h.type === 'fragment');

      for (const f of fragments) {
        matchers.push({
          match: mp.path !== '/' ? join(mp.path, f.match) : f.match,
          handler: content => f.handler(mp.path, content),
          type: f.name,
        })
      }
    }

    for (const mp of mountPoints) {
      const pages = pluginMap[mp.plugin].handlers.filter(h => h.type === 'page');

      for (const p of pages) {
        matchers.push({
          match: mp.path !== '/' ? join(mp.path, p.match) : p.match,
          handler: content => p.handler(mp.path, content),
          type: p.name,
        })
      }
    }

    return new ContentLoader(matchers);
  }

  load(content: ParsedDocument): FileNode {
    for (const { match, handler } of this.matchers) {
      if (minimatch(content.path, match)) {
        return handler(content);
      }
    }
    throw Error('No handler for content');
  }
}
