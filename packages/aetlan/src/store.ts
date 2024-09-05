import { Database, Filter, Collection, Document } from '@tashmet/tashmet';
import { Route, SourceDocument, TargetFile } from "./interfaces.js";

import ev from "eventemitter3";

const { EventEmitter } = ev;

export interface StoreWatcher {
  on(event: 'content-changed', handler: (content: SourceDocument) => void): this;
}

export class Store {
  private watcher = new EventEmitter();

  constructor(
    private content: Collection<SourceDocument>,
    private routes: Collection<Route>,
    private target: Collection<TargetFile>,
  ) {}

  static fromDatabase(db: Database) {
    return new Store(
      db.collection('source'),
      db.collection('routes'),
      db.collection('target'),
    );
  }

  watch(): StoreWatcher {
    return this.watcher;
  }

  async reloadContent(path: string) {
    const doc = await this.content.findOne({ path });
    if (doc) {
      this.watcher.emit('content-changed', doc);
    }
  }

  findContent(filter: Filter<SourceDocument>) {
    return this.content.find(filter);
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
