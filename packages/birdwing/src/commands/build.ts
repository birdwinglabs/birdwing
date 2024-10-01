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
import { StaticRenderer } from '../react/static.js';
import { configureTheme } from '../builders/theme.js';

import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Logger } from '../logger.js';

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

    const themeCode = await this.executeTask(new BuildTask(configureTheme(this.root, theme), {
      start: 'Building theme...',
      success: 'Built theme',
    }));

    const components: any = {};
    //console.log(themeCode);
    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console: console,
      TextEncoder,
      URL,
      components,
    }

    vm.runInNewContext(themeCode[0].content, sandbox);

    //console.log(sandbox.components);

    const renderer = new StaticRenderer(sandbox.components);
    const js = routes.map(route => ({ url: route.url, code: renderer.render(route.tag) }));

    const output: TargetFile[] = [
      await this.executeTask(
        new BuildTask(configureProducationClient(this.root, theme, routes, languages, js), {
          start: 'Building SPA client...',
          success: 'Built SPA client',
        })
      ),
      await this.executeTask(new RenderSSRTask(application, routes, this.root, warnings)),
      //await this.executeTask(new SerializeRoutesTask(routes, outDir)),
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
