import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { generateCss } from '../css.js';
import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { configureEditor } from '../builders/editor.js';
import { Theme } from '../theme.js';
import { Command } from '../command.js';
import { HtmlBuilder } from '../html.js';
import { DevServer } from './dev/server.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';

export class EditCommand extends Command {
  async execute() {
    this.logger.info('Starting editor...\n');

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));

    const store = await createStorageEngine();
    const db = await createDatabase(store, this.root, true);

    const aetlan = new Aetlan(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: this.config.content,
      variables: this.config.variables || {},
    });

    const routes = this.executeTask(new CompileRoutesTask(aetlan));

    try {
      this.logger.start('Building server app...');
      await this.buildApp(theme, aetlan.store);
      this.logger.success('Built server app');
    } catch(err) {
      this.logger.error('Build server app failed');
      throw err;
    }

    const editorCss = fs.readFileSync(path.join(this.root, '../../node_modules/@aetlan/editor/dist/editor.css')).toString();
    await aetlan.store.write('/editor.css', editorCss);

    try {
      this.logger.start('Generating HTML...');
      await this.generateHtml(theme, aetlan.store);
      this.logger.success('Generated HTML');
    } catch (err) {
      this.logger.error('Generating HTML failed');
      throw err;
    }

    await aetlan.store.write('/config.json', JSON.stringify(this.config));

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(aetlan.store, store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    this.logger.box('Website ready at `%s`', `http://localhost:${port}`);
  }

  private async generateHtml(theme: Theme, store: Store) {
    const html = HtmlBuilder.fromFile(path.join(theme.path, 'main.html'))
      .script('/dev.js')
      .link('/editor.css', 'stylesheet')
      .serialize();
    await store.write('/main.html', html);
  }

  private async buildApp(theme: Theme, store: Store) {
    const buildRes = await esbuild.build(configureEditor(this.root, await glob.glob(theme.componentGlob)));

    if (buildRes.outputFiles) {
      await store.write('/dev.js', buildRes.outputFiles[0].text);
    }
    await store.write('/main.css', await generateCss(path.join(this.root, 'theme'), path.join(this.root, 'out')));
  }

  //private createServer() {
    //return http.createServer(async (req, res) => {
      //const url = req.url || '';
      //const route = await this.aetlan.store.getRoute(url);

      //if (route) {
        //const content = await this.aetlan.store.getOutput('/main.html');
        //res.setHeader('Content-Type', 'text/html');
        //res.write(content || '');
        //res.end();
      //} else {
        //const content = await this.aetlan.store.getOutput(req.url || '');
        //if (req.url?.endsWith('.js')) {
          //res.setHeader('Content-Type', 'text/javascript')
        //}
        //res.write(content || '');
        //res.end();
      //}
    //});
  //}
}
