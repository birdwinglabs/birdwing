import http from 'http';
import fs from 'fs';
import { join, basename, dirname } from 'path';
import { Store } from '@birdwing/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';

import Markdoc, { RenderableTreeNode } from '@markdoc/markdoc';

const { Tag } = Markdoc;

function toXmlAttributes(attr: Record<string, any>) {
  return Object.entries(attr).map(([k, v]) => {
    switch (typeof v) {
      case 'string':
      case 'number':
      case 'boolean':
        return `${k}="${v}"`;
      case 'undefined': 
      default:
        return undefined;
    }
  })
    .filter(v => v !== undefined)
    .join(' ');
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return '';
    }
  });
}

export function toXml(tag: RenderableTreeNode): string {
  if (Tag.isTag(tag)) {
    const open = `<${tag.name} ${toXmlAttributes(tag.attributes)}>`;
    const close = `</${tag.name}>`;

    const inner = tag.name === 'fence' || tag.name === 'html'
      ? escapeXml(tag.children[0] as string)
      : tag.children.map(c => toXml(c)).join('');

    return open + inner + close;
  }

  return tag?.toString() || '';
}


export class DevServer {
  private server: http.Server;
  private tashmetServer: TashmetServer;

  constructor(private store: Store, private storageEngine: StorageEngine) {}

  initialize() {
    this.server = http.createServer(async (req, res) => {
      const url = req.url || '';
      const route = await this.store.getRoute(url);

      if (route) {
        const content = await this.store.getOutput('/main.html');
        res.setHeader('Content-Type', 'text/html');
        res.write(content || '');
        res.end();
      } else {
        if (req.url?.endsWith('.xml')) {
          const url = req.url as string;
          res.setHeader('Content-Type', 'text/xml');
          let routeUrl = join(dirname(url), basename(url, '.xml'));
          if (routeUrl === '/index') {
            routeUrl = '/';
          }
          const route = await this.store.getRoute(routeUrl);
          const xml = toXml(route?.tag || {});
          console.log(xml);
          res.write(xml);
          res.end();
          return;
        }

        let content = await this.store.getOutput(req.url || '');
        if (req.url?.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml');
        }
        if (req.url?.endsWith('.jpg')) {
          res.setHeader('Content-Type', 'image/jpeg');
          const stream = fs.createReadStream(join('pages', url));
          stream.pipe(res);
          return;
        }
        if (req.url?.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript');
        }
        res.write(content || '');
        res.end();
      }
    });
    this.tashmetServer = new TashmetServer(this.storageEngine, this.server)
    return this;
  }

  listen(port: number) {
    this.tashmetServer.listen();
    this.server.listen(port);
  }
}