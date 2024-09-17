import pb from 'path-browserify';
import ev from "eventemitter3";

import { FragmentDocument, PageDocument, Route, SourceDocument } from "@aetlan/core";
import { Transformer, PluginConfig, RouteCallback } from "@aetlan/core";
import { isSubPath } from "@aetlan/core";
import { ContentCache } from "./cache.js";

const { EventEmitter } = ev;
const { dirname } = pb;


export class CompileContext {
  constructor(
    private watcher: any,
    private cache: ContentCache,
    private compiler: Compiler,
  ) {}

  on(event: 'route-compiled' | 'route-removed', handler: (route: Route) => void) {
    switch (event) {
      case 'route-compiled':
        this.watcher.on('route-compiled', handler);
        return this;
      case 'route-removed':
        this.watcher.on('route-removed', handler);
        return this;
    }
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
  private routes: Record<string, Route<any>> = {};
  private injectors: Record<string, RouteCallback<any>> = {};

  constructor(
    private pluginMap: Record<string, PluginConfig<Route<any>>>,
    private transformer: Transformer,
    private cache: ContentCache,
  ) {
    for (const doc of cache.content) {
      if (doc instanceof PageDocument) {
        this.transformer.linkPath(doc.path, doc.url);
      }
    }
  }

  watch(): CompileContext {
    const watcher = new EventEmitter();
    const ctx = new CompileContext(watcher as any, this.cache, this);

    const updatePage = (page: PageDocument) => {
      this.transformer.linkPath(page.path, page.url);
      const route = this.transformPage(page);
      this.routes[page.path] = route;

      const fragments = this.cache
        .dependencies(page)
        .filter(doc => doc.type === 'fragment') as FragmentDocument[];

      for (const f of fragments) {
        const injector = this.injectors[f.path];
        injector(route);
      }

      watcher.emit('route-compiled', route);
    }

    const updateFragment = (fragment: FragmentDocument, affected: PageDocument[]) => {
      const injector = this.transformFragment(fragment);
      if (injector) {
        this.injectors[fragment.path] = injector;

        const routes = Object.values(this.routes)
          .filter(r => affected.findIndex(a => a.url === r.url) >= 0)

        for (const route of routes) {
          injector(route);
          watcher.emit('route-compiled', route);
        }
      }
    }

    this.cache.watch()
      .on('page-changed', page => {
        updatePage(page);
      })
      .on('partial-changed', ({ doc, affected }) => {
        this.transformer.setPartial(doc.path, doc.ast);
        for (const page of affected.filter(doc => doc.type === 'page') as PageDocument[]) {
          updatePage(page);
        }
        for (const fragment of affected.filter(doc => doc.type === 'fragment') as FragmentDocument[]) {
          updateFragment(fragment, this.cache.dependants(fragment) as PageDocument[]);
        }
      })
      .on('fragment-changed', ({ doc, affected }) => {
        updateFragment(doc, affected);
      });

    return ctx;
  }

  transform() {
    for (const doc of this.pages) {
      const route = this.transformPage(doc);
      this.routes[doc.path] = route;
    }

    for (const doc of this.fragments) {
      const injector = this.transformFragment(doc);
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

    return Object.values(this.routes);
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
}
