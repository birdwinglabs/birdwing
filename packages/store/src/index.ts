import Tashmet, { Database, Filter, Collection, Document } from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';
import { Route, SourceDocument, TargetFile } from "@aetlan/core";

import ev from "eventemitter3";

const { EventEmitter } = ev;

export interface StoreWatcher {
  on(event: 'content-changed', handler: (content: SourceDocument) => void): this;

  on(event: 'route-changed', handler: (route: Route) => void): this;

  on(event: 'target-changed', handler: (file: TargetFile) => void): this;
}

export class Store {
  private watcher = new EventEmitter();

  constructor(
    private source: Collection<SourceDocument>,
    private routes: Collection<Route>,
    private target: Collection<TargetFile>,
    public dispose: () => void,
  ) {
    routes.watch().on('change', change => {
      if (change.operationType === 'replace' || change.operationType === 'update') {
        this.watcher.emit('route-changed', change.fullDocument);
      }
    });
    target.watch().on('change', change => {
      if (change.operationType === 'replace' || change.operationType === 'update') {
        this.watcher.emit('target-changed', change.fullDocument);
      }
    });
  }

  static async connect(addr: string) {
    const tashmet = new Tashmet(new ServerProxy(addr));

    await tashmet.connect();
    const db = tashmet.db('aetlan');
    const source = db.collection<SourceDocument>('source');
    const routes = db.collection<Route>('routes');
    const target = db.collection<TargetFile>('target');

    return new Store(source, routes, target, () => tashmet.close())
  }

  static fromDatabase(db: Database) {
    return new Store(
      db.collection('source'),
      db.collection('routes'),
      db.collection('target'),
      () => {}
    );
  }

  watch(): StoreWatcher {
    return this.watcher;
  }

  async reloadContent(path: string) {
    const doc = await this.source.findOne({ path });
    if (doc) {
      this.watcher.emit('content-changed', doc);
    }
  }

  findContent(filter: Filter<SourceDocument>) {
    return this.source.find(filter);
  }

  saveContent(content: SourceDocument) {
    return this.source.replaceOne({ _id: content._id }, content, { upsert: true });
  }

  getSourceByRoute(route: Route) {
    const contentId = route.source;
    //const [type, path] = contentId.split(':');
    return this.source.findOne({ _id: route.source });

    //if (type === 'partial') {
      //return this.source.findOne({ path: `partials/${path}`});
    //} else {
      //return this.source.findOne({ path: `pages/${path}`});
    //}
  }

  getRoute(url: string) {
    return this.routes.findOne({ url: url !== '/' ? url.replace(/\/$/, "") : url });
  }

  async updateRoute(route: Route) {
    await this.routes.replaceOne({ url: route.url }, route, { upsert: true });
  }

  async updateRouteAttributes(url: string, attributes: Document) {
    await this.routes.updateOne(
      { url: url }, { $set: { 'tag.attributes': attributes } }
    );
  }

  async write(file: string, content: string) {
    await this.target.replaceOne({ _id: file }, { _id: file, content }, { upsert: true });
  }

  async getOutput(file: string): Promise<string | null> {
    const f = await this.target.findOne({ _id: file });
    if (f) {
      return f.content;
    }
    return null;
  }
}
