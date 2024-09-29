import path from 'path';
import fs from 'fs';

import * as glob from 'glob';
import * as esbuild from 'esbuild'

import { createDatabase, createStorageEngine } from '../database.js';

import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';
import { configureEditor } from '../builders/editor.js';
import { Theme } from '../theme.js';
import { Command, Task } from '../command.js';
import { HtmlBuilder } from '../html.js';
import { DevServer } from '../servers/dev-server.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';
import { BuildTask } from '../tasks/build.js';
import { TargetFile } from '@aetlan/core';
import { FileWriterTask } from '../tasks/file-writer.js';
import { TailwindCssTask } from '../tasks/tailwind.js';


class ProcessHtmlTask extends Task<TargetFile> {
  constructor(private theme: Theme) {
    super({
      start: 'Processing HTML...',
      success: 'Processed HTML',
    })
  }

  async *execute() {
    const html = HtmlBuilder.fromFile(path.join(this.theme.path, 'main.html'))
      .script('/editor.js')
      .link('/editor.css', 'stylesheet')
      .link('/main.css', 'stylesheet')
      .serialize();
    return { _id: '/main.html', content: html };
  }
}

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

    const routes = await this.executeTask(new CompileRoutesTask(aetlan));
    for (const route of routes) {
      aetlan.store.updateRoute(route);
    }

    const buildContext = await esbuild.context(configureEditor(this.root, await glob.glob(theme.componentGlob)));
    const buildTask = new BuildTask(buildContext, {
      start: 'Building SPA client',
      success: 'Built SPA client',
      fail: 'Building SPA client failed'
    });
    const editorCss = fs.readFileSync(path.join(this.root, '../../node_modules/@aetlan/editor/dist/editor.css')).toString();

    const output: TargetFile[] = [
      await this.executeTask(buildTask),
      await this.executeTask(new ProcessHtmlTask(theme)),
      await this.executeTask(new TailwindCssTask(theme, '/')),
      { _id: '/config.json', content: JSON.stringify(this.config) },
      { _id: '/editor.css', content: editorCss },
    ].flat()

    await this.executeTask(new FileWriterTask(aetlan.store, output));

    this.logger.start('Starting server...');

    const port = 3000;
    new DevServer(aetlan.store, store)
      .initialize()
      .listen(port);

    this.logger.success("Server started");
    this.logger.box('Website ready at `%s`', `http://localhost:${port}`);
  }
}
