import path from 'path';

import { Compiler } from '@birdwing/compiler';
import { Store } from '@birdwing/store';
import { TargetFile } from '@birdwing/core';

import { createDatabase, createStorageEngine } from '../database.js';
import { Command, TaskWarning } from '../command.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';
import { BuildSsrAppTask } from '../tasks/ssr-build.js';
import { RenderSSRTask } from '../tasks/ssr-render.js';
import { TailwindCssTask } from '../tasks/tailwind.js';
import { FileWriterTask } from '../tasks/file-writer.js';
import { BuildTask } from '../tasks/build.js';
import { configureProducationClient } from '../builders/client-producation.js';
import { ExtractFenceLanguagesTask } from '../tasks/extract-fence-languages.js';
import { SerializeRoutesTask } from '../tasks/serialize-routes.js';


export class BuildCommand extends Command {
  async execute() {
    console.log("Production build:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const db = await createDatabase(await createStorageEngine(), this.root, false);
    const store = Store.fromDatabase(db);
    const compiler = await Compiler.configure(Store.fromDatabase(db), theme, this.config);
    const outDir = path.join(this.root, 'out');

    const warnings: TaskWarning[] = [];

    const routes = await this.executeTask(
      new CompileRoutesTask(compiler)
    );
    const application = await this.executeTask(
      new BuildSsrAppTask(theme, warnings)
    );
    const languages = await this.executeTask(
      new ExtractFenceLanguagesTask(compiler.cache.documents)
    );

    const output: TargetFile[] = [
      await this.executeTask(
        new BuildTask(configureProducationClient(this.root, theme, routes, languages), {
          start: 'Building SPA client...',
          success: 'Built SPA client',
        })
      ),
      await this.executeTask(new RenderSSRTask(application, routes, this.root, warnings)),
      await this.executeTask(new SerializeRoutesTask(routes, outDir)),
      await this.executeTask(new TailwindCssTask(theme, outDir))
    ].flat()

    await this.executeTask(new FileWriterTask(store, output));

    this.logger.box('Build finished\n\nTo preview the app run:\n`npm run preview`');
  }
}
