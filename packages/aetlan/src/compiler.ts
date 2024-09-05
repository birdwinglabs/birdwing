import { Document } from "@tashmet/tashmet";
import { dirname } from 'path';

import { FragmentDocument, PageDocument, Route } from "./interfaces.js";
import { Transformer } from "./transformer.js";
import { PluginConfig, RouteCallback } from "./plugin.js";
import { isSubPath } from "./util.js";
import { ContentCache } from "./cache.js";

//function getPlugin(doc: AbstractDocument, pluginMap: Record<string, PluginConfig<Renderable<any>>>) {
  //for (const [path, plugin] of Object.entries(pluginMap)) {
    //if (isSubPath(doc.path, path)) {
      //return plugin;
    //}
  //}
  //throw Error('No plugin');
//}

//function getRoot(doc: AbstractDocument, pluginMap: Record<string, PluginConfig<Renderable<any>>>) {
  //for (const path of Object.keys(pluginMap)) {
    //if (isSubPath(doc.path, path)) {
      //return path;
    //}
  //}
  //return '/';
//}

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

  watch(target: ContentTarget) {
    for (const route of this.transform()) {
      target.mount(route);
    }

    const updatePage = (page: PageDocument) => {
      this.transformer.linkPath(page.path, page.url);
      const route = this.transformPage(page);
      this.routes[page.path] = route;
      target.mount(route);
    }

    const updateFragment = (fragment: FragmentDocument, affected: PageDocument[]) => {
      const injector = this.transformFragment(fragment);
      if (injector) {
        this.injectors[fragment.path] = injector;

        const routes = Object.values(this.routes)
          .filter(r => affected.findIndex(a => a.url === r.url) > 0)

        for (const route of routes) {
          injector(route);
          target.mount(route);
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
          //updateFragment(fragment);
        }
      })
      .on('fragment-changed', ({ doc, affected }) => {
        updateFragment(doc, affected);
      });
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

export interface ContentTarget {
  mount(route: Route): void;

  unmount(url: string): void;
}
