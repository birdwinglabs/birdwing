import { program } from 'commander';
import { Aetlan, Build, DevServer, Preview } from '@aetlan/aetlan';
import path from 'path';
import { AetlanDocs } from '@aetlan/docs';
import { AetlanPages } from '@aetlan/pages';

export function makeSource(type: string, root: string, config: any) {
  switch (type) {
    case 'documentation':
      return new AetlanDocs({ path: path.resolve(root, config.path) });
    case 'site':
      return new AetlanPages({ path: path.resolve(root, config.path) });
    default:
      throw Error('Unknown source: ' + type);
  }
}

function createAetlan(cfgPath: string) {
  const root = path.dirname(cfgPath);

  return Aetlan.create(root, {
    page: new AetlanPages({ path: root }),
    documentation: new AetlanDocs({ path: root }),
  });
}

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await new Build(await createAetlan(cfgPath)).run();
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await new DevServer(await createAetlan(cfgPath)).run()
    });

  program
    .command('preview')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await new Preview(await createAetlan(cfgPath)).run();
    });

  program.parse();
}
