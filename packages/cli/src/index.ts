import { program } from 'commander';
import { Build, DevServer, EditorServer, Preview } from '@aetlan/server';
import path from 'path';

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const build = await Build.configure(cfgPath);
      await build.run();
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const devServer = await DevServer.configure(cfgPath);
      await devServer.run();
    });

  program
    .command('edit')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const editServer = await EditorServer.configure(cfgPath);
      await editServer.run();
    });

  program
    .command('preview')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await new Preview(path.dirname(cfgPath)).run();
    });

  program.parse();
}
