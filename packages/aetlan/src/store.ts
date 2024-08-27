import { Database, Filter, Collection, Document } from '@tashmet/tashmet';
import { ParsedDocument, Route, SourceDocument, TargetFile } from "./interfaces.js";

import ev from "eventemitter3";
import Markdoc, { Node } from '@markdoc/markdoc';

const { EventEmitter } = ev;

export function findPartials(ast: Node): string[] {
  const partials: string[] = [];

  for (const node of ast.walk()) {
    if (node.tag === 'partial') {
      partials.push(node.attributes.file);
    }
  }

  return partials;
}

export class ContentParser {
  parse({ path, body, frontmatter }: SourceDocument): ParsedDocument | null {
    const ast = Markdoc.parse(body);
    const partials = findPartials(ast);

    const match = /^(.+?)\/(((.+?)\/)?(([^\/]+).md$))/.exec(path);
    if (match) {
      const folder = match[1];
      const path = match[2];
      const basename = match[6];

      const isFragment = basename.toUpperCase() === basename && basename !== 'README';

      if (folder === 'partials') {
        return { type: 'partial', path, ast, frontmatter, partials };
      }

      if (folder === 'pages') {
        return { type: isFragment ? 'fragment' : 'page', path, ast, frontmatter, partials }
      }
    }

    return null;
  }
}

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
    return this.routes.findOne({ _id: url !== '/' ? url.replace(/\/$/, "") : url });
  }

  async updateRoute(route: Route) {
    await this.routes.replaceOne({ _id: route.url }, route, { upsert: true });
  }

  async updateRouteAttributes(url: string, attributes: Document) {
    await this.routes.updateOne(
      { _id: url }, { $set: { 'tag.attributes': attributes } }
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
