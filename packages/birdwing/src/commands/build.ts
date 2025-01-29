import path from 'path';
import fs from 'fs';

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
import { ImagesTask } from '../tasks/images.js';
import { configureTheme } from '../buildconfigs/theme.js';
import { LoadThemeTemplateTask } from '../tasks/load-theme-template.js';

export class BuildCommand extends Command {
  async execute() {
    console.log("Production build:\n");

    const theme = await this.executeTask(new LoadThemeTask(this.config, this.root));
    const db = await createDatabase(await createStorageEngine(), this.root, false);
    const store = Store.fromDatabase(db);
    const compiler = await Compiler.configure(Store.fromDatabase(db), theme, this.config);
    const outDir = path.join(this.root, 'out');

    const warnings: TaskWarning[] = [];

    const imagesTask = new ImagesTask(db, compiler, {
      start: 'Aggregating images',
      success: files => `Aggregated ${files.length} images`,
      fail: 'Aggregating images failed',
    });
    const images = await this.executeTask(imagesTask);

    for (const file of images) {
      fs.copyFileSync(path.join('pages', file._id), path.join('out', file._id));
    }

    const routes = await this.executeTask(
      new CompileRoutesTask(compiler)
    );
    const themeBuild = await this.executeTask(new BuildTask(configureTheme(this.root, theme, {}), {
      start: 'Building theme',
      success: 'Built theme',
    }));

    //console.log(themeBuild);

    const themeTemplate = await this.executeTask(new LoadThemeTemplateTask(themeBuild[0].content));

    const ssrOutput = await this.executeTask(new BuildTask(configureSsr(theme), {
      start: 'Building SSR application',
      success: 'Built SSR application'
    }));

    const languages = await this.executeTask(
      new ExtractFenceLanguagesTask(compiler.cache.documents)
    );

    const staticRoutes = await this.executeTask(new RenderStaticRoutesTask(routes, themeTemplate, {
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
      await this.executeTask(new TailwindCssTask(theme, outDir)),
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
