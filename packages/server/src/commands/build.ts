import path from 'path';

import { createDatabase, createStorageEngine } from '../database.js';
import { Compiler } from '../../../compiler/dist/index.js';
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
    const db = await createDatabase(await createStorageEngine(), this.root, false);
    const store = Store.fromDatabase(db);

    const compiler = await Compiler.configure(Store.fromDatabase(db), {
      tags: theme.tags,
      nodes: theme.nodes,
      documents: theme.documents,
      plugins: theme.plugins,
      content: this.config.content,
      variables: this.config.variables || {},
    });

    const warnings: TaskWarning[] = [];

    const routes = await this.executeTask(
      new CompileRoutesTask(compiler)
    );
    const application = await this.executeTask(
      new BuildSsrAppTask(theme, warnings)
    );
    const output: TargetFile[] = [
      await this.executeTask(new RenderSSRTask(application, routes, this.root, warnings)),
      await this.executeTask(new TailwindCssTask(theme, path.join(this.root, 'out')))
    ].flat()

    await this.executeTask(new FileWriterTask(store, output));

    this.logger.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }
}
