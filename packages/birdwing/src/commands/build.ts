import path from 'path';

import { Compiler } from '@birdwing/compiler';
import { Store } from '@birdwing/store';
import { TargetFile } from '@birdwing/core';

import { createDatabase, createStorageEngine } from '../database.js';
import { Command, TaskWarning } from '../command.js';
import { LoadThemeTask } from '../tasks/load-theme.js';
import { CompileRoutesTask } from '../tasks/compile-routes.js';
import { RenderSSRTask } from '../tasks/ssr-render.js';
import { TailwindCssTask } from '../tasks/tailwind.js';
import { FileWriterTask } from '../tasks/file-writer.js';
import { BuildTask } from '../tasks/build.js';
import { configureProducationClient } from '../buildconfigs/client-producation.js';
import { ExtractFenceLanguagesTask } from '../tasks/extract-fence-languages.js';
import { Logger } from '../logger.js';
import { configureSsr } from '../buildconfigs/ssr.js';
import { RenderStaticRoutesTask } from '../tasks/render-static-routes.js';

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
    const ssrOutput = await this.executeTask(new BuildTask(configureSsr(theme), {
      start: 'Building SSR application',
      success: 'Built SSR application'
    }));

    const languages = await this.executeTask(
      new ExtractFenceLanguagesTask(compiler.cache.documents)
    );

    const staticRoutes = await this.executeTask(new RenderStaticRoutesTask(routes, {
      start: 'Rendering static routes...',
      success: 'Rendered static routes',
    }));

    const output: TargetFile[] = [
      await this.executeTask(
        new BuildTask(configureProducationClient(this.root, theme, staticRoutes, languages), {
          start: 'Building SPA client...',
          success: 'Built SPA client',
        })
      ),
      await this.executeTask(new RenderSSRTask(ssrOutput[0].content, routes, this.root, warnings)),
      await this.executeTask(new TailwindCssTask(theme, outDir))
    ].flat()

    await this.executeTask(new FileWriterTask(store, output));

    this.printSummary(output);
  }

  private printSummary(output: TargetFile[]) {
    const fileSize = (content: string) => {
      return Math.round(Buffer.from(content).byteLength / 1000)
    }

    const relPath = (p: string) => {
      return path.relative(this.root, p);
    }

    const listFiles = (ext: string) => {
      return output
        .filter(f => f._id.endsWith(ext))
        .sort((a, b) => a._id.localeCompare(b._id))
        .map(f => `${Logger.color('gray', relPath(f._id))} (${fileSize(f.content)} KB)`).join('\n  ');
    }

    this.logger.box('Build finsihed\n\nCSS:\n  %s\nJavaScript:\n  %s\n\nTo preview the app run:\n`npm run preview`',
        listFiles('.css'), listFiles('.js'))
  }
}
