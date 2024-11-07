import http from 'http';
import fs from 'fs';
import path from 'path';
import { Store } from '@birdwing/store';
import { StorageEngine } from '@tashmet/engine';
import TashmetServer from '@tashmet/server';


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
        let content = await this.store.getOutput(req.url || '');
        //if (!content) {
          //try {
            //content = fs.readFileSync(path.join('out', req.url || ''), 'utf-8');
          //} catch (err) {

          //}
        //}
        if (req.url?.endsWith('.svg')) {
          res.setHeader('Content-Type', 'image/svg+xml')
        }
        if (req.url?.endsWith('.js')) {
          res.setHeader('Content-Type', 'text/javascript')
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