import { program } from 'commander';
import { Build, DevServer, Preview } from '@aetlan/server';
import path from 'path';
import docs from '@aetlan/docs';
import pages from '@aetlan/pages';

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const build = await Build.create(path.dirname(cfgPath), [
        docs({ path: 'docs' }),
        pages({ path: '/' }),
      ]);
      await build.run();
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const devServer = await DevServer.create(path.dirname(cfgPath), [
        docs({ path: 'docs' }),
        pages({ path: '/' }),
      ]);
      await devServer.run();
    });

  program
    .command('preview')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await new Preview(path.dirname(cfgPath)).run();
    });

  program.parse();
}
