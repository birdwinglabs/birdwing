import path from 'path';

import { createDatabase, createStorageEngine } from '../database.js';
import { Aetlan } from '@aetlan/aetlan';
import { Store } from '@aetlan/store';

import { Command, TaskWarning } from '../command.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';
import { BuildSsrAppTask } from '../tasks/ssr-build.js';
import { RenderSSRTask } from '../tasks/ssr-render.js';
import { TailwindCssTask } from '../tasks/tailwind.js';
import { FileWriterTask } from '../tasks/file-writer.js';
import { TargetFile } from '@aetlan/core';


export class BuildCommand extends Command {
  async execute() {
    console.log("Production build:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const store = await createStorageEngine();
    const db = await createDatabase(store, this.root, false);

    const aetlan = new Aetlan(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: this.config.content,
      variables: this.config.variables || {},
    });

    const warnings: TaskWarning[] = [];

    const routes = await this.executeTask(
      new CompileRoutesTask(aetlan)
    );
    const application = await this.executeTask(
      new BuildSsrAppTask(theme, warnings)
    );
    const output: TargetFile[] = [
      ...await this.executeTask(new RenderSSRTask(application, routes, this.root, warnings)),
      await this.executeTask(new TailwindCssTask(theme, path.join(this.root, 'out')))
    ];
    await this.executeTask(new FileWriterTask(aetlan.store, output));

    this.logger.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }
}
