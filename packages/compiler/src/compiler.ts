import pb from 'path-browserify';
import ev from "eventemitter3";

import { AppConfig, FragmentDocument, PageDocument, Route, RouteData, SourceDocument, ThemeConfig } from "@birdwing/core";
import { Transformer, PluginConfig, RouteCallback } from "@birdwing/core";
import { isSubPath } from "@birdwing/core";
import { ContentCache } from "./cache.js";
import { Store } from '@birdwing/store';
import { MarkdocTransformer } from './transformer.js';

const { EventEmitter } = ev;
const { dirname } = pb;


export class CompileContext {
  constructor(
    private watcher: any,
    public cache: ContentCache,
    private compiler: Compiler,
  ) {}

  on(event: 'route-compiled', handler: (route: Route) => void): this;
  on(event: 'route-removed', handler: (route: Route) => void): this;
  on(event: 'done', handler: (routes: Route[]) => void): this;
  on(event: 'route-compiled' | 'route-removed' | 'done', handler: (...args: any[]) => void) {
    this.watcher.on(event, handler);
    return this;
  }

  transform() {
    for (const route of this.compiler.transform()) {
      this.watcher.emit('route-compiled', route);
    }
  }

  pushContent(doc: SourceDocument) {
    this.cache.update(doc);
  }
}

export class Compiler {
  private routes: Record<string, RouteData> = {};
  private injectors: Record<string, RouteCallback<any>> = {};

  constructor(
    private pluginMap: Record<string, PluginConfig<RouteData>>,
    private transformer: Transformer,
    public readonly cache: ContentCache,
  ) {
    for (const doc of cache.content) {
      if (doc instanceof PageDocument) {
        this.transformer.linkPath(doc.path, doc.url);
      }
    }
  }

  static async configure(store: Store, themeConfig: ThemeConfig, appConfig: AppConfig) {
    const { tags, nodes, documents } = themeConfig;
    const cache = await ContentCache.load(store);
    const transformer = new MarkdocTransformer(tags, nodes, documents, {}, appConfig.variables);
    for (const {path, ast} of cache.partials) {
      transformer.setPartial(path, ast);
    }
    const plugins = appConfig.content.reduce((pluginMap, content) => {
      const plugin = themeConfig.plugins.find(p => p.name === content.plugin);

      if (plugin) {
        pluginMap[content.path] = plugin.mount(content.path, transformer);
      }
      return pluginMap;
    }, {} as Record<string, PluginConfig<Route>>)

    return new Compiler(plugins, transformer, cache);
  }

  setVariable(name: string, value: any) {
    this.transformer.setVariable(name, value);
  }

  watch(): CompileContext {
    const watcher = new EventEmitter();
    const ctx = new CompileContext(watcher as any, this.cache, this);

    const updatePage = (page: PageDocument) => {
      this.transformer.linkPath(page.path, page.url);
      const plugin = this.getPlugin(page.path);
      const data = plugin.page(page);
      //const route = this.transformPage(page);
      this.routes[page.path] = data;

      const fragments = this.cache
        .dependencies(page)
        .filter(doc => doc.type === 'fragment') as FragmentDocument[];

      for (const f of fragments) {
        const injector = this.injectors[f.path];
        injector(data);
      }

      const route = plugin.compile(data);

      console.log(route);

      watcher.emit('route-compiled', route);
      return [route];
    }

    const updateFragment = (fragment: FragmentDocument, affected: PageDocument[]) => {
      const plugin = this.getPlugin(fragment.path);
      //const injector = this.transformFragment(fragment);
      const injector = plugin.fragments[fragment.name](fragment);
      if (injector) {
        this.injectors[fragment.path] = injector;

        const routes = Object.values(this.routes)
          .filter(r => affected.findIndex(a => a.url === r.url) >= 0)

        for (const route of routes) {
          injector(route);
          watcher.emit('route-compiled', route);
        }
        return routes.map(r => plugin.compile(r));
      }
      return [];
    }

    this.cache.watch()
      .on('page-changed', page => {
        const routes = updatePage(page);
        watcher.emit('done', routes);
      })
      .on('partial-changed', ({ doc, affected }) => {
        this.transformer.setPartial(doc.path, doc.ast);
        const routes: Route[] = [];
        for (const page of affected.filter(doc => doc.type === 'page') as PageDocument[]) {
          routes.push(...updatePage(page))
        }
        for (const fragment of affected.filter(doc => doc.type === 'fragment') as FragmentDocument[]) {
          routes.push(...updateFragment(fragment, this.cache.dependants(fragment) as PageDocument[]));
        }
        watcher.emit('done', routes);
      })
      .on('fragment-changed', ({ doc, affected }) => {
        const routes = updateFragment(doc, affected);
        watcher.emit('done', routes);
      });

    return ctx;
  }

  transform() {
    for (const doc of this.pages) {
      const plugin = this.getPlugin(doc.path);
      const route = plugin.page(doc);
      this.routes[doc.path] = route;
    }

    for (const doc of this.fragments) {
      const plugin = this.getPluginForFragment(doc);
      const injector = plugin.fragments[doc.name](doc);
      if (injector) {
        this.injectors[doc.path] = injector;
      }
    }

    for (const [path, injector] of Object.entries(this.injectors)) {
      const routes = Object.entries(this.routes)
        .filter(([p, route]) => isSubPath(p, dirname(path)))
        .map(([p, route]) => route);

      for (const route of routes) {
        injector(route);
      }
    }

    return Object.entries(this.routes).map(([path, data]) => {
      const plugin = this.getPlugin(path);
      return plugin.compile(data);
    });
  }

  get pages(): PageDocument[] {
    return this.cache.content
      .filter(d => d instanceof PageDocument) as PageDocument[];
  }

  get fragments(): FragmentDocument[] {
    return this.cache.content
      .filter(d => d instanceof FragmentDocument) as FragmentDocument[];
  }

  private transformPage(doc: PageDocument) {
    for (const [path, plugin] of Object.entries(this.pluginMap)) {
      if (isSubPath(doc.path, path)) {
        return plugin.page(doc);
      }
    }
    console.log(this.pluginMap);
    throw Error('No plugin');
  }

  private transformFragment(doc: FragmentDocument) {
    for (const [path, plugin] of Object.entries(this.pluginMap)) {
      if (isSubPath(doc.path, path) && doc.name in plugin.fragments) {
        return plugin.fragments[doc.name](doc);
      }
    }
  }

  private getPlugin(docPath: string) {
    for (const [path, plugin] of Object.entries(this.pluginMap)) {
      if (isSubPath(docPath, path)) {
        return plugin;
      }
    }
    //console.log(this.pluginMap);
    throw Error(`No plugin for path: ${docPath}`);
  }

  private getPluginForFragment(doc: FragmentDocument) {
    for (const [path, plugin] of Object.entries(this.pluginMap)) {
      if (isSubPath(doc.path, path) && doc.name in plugin.fragments) {
        return plugin;
      }
    }
    throw Error('No plugin');
  }
}
