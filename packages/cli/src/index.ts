import { program } from 'commander';
import { Aetlan, Build, DevServer, Preview } from '@aetlan/aetlan';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AetlanDocs } from '@aetlan/docs';
import { AetlanPages } from '@aetlan/pages';
import sveltekit from '@aetlan/sveltekit';
import react from '@aetlan/react';

export function makeTarget(type: string, root: string) {
  switch (type) {
    case 'sveltekit':
      return sveltekit({
        path: root,
      });
    case 'react':
      return react({
        path: root,
      });
    default:
      throw Error('Unknown target: ' + type);
  }
}

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

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const cfgFile: any = yaml.load(fs.readFileSync(cfgPath).toString());
      const root = path.dirname(cfgPath);

      const aetlan = await Aetlan.create(root, makeTarget(cfgFile.target, root), {
        page: new AetlanPages({ path: root }),
        documentation: new AetlanDocs({ path: root }),
      });

      const builder = new Build(aetlan);
      builder.run(root);
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const cfgFile: any = yaml.load(fs.readFileSync(cfgPath).toString());
      const root = path.dirname(cfgPath);

      const aetlan = await Aetlan.create(root, makeTarget(cfgFile.target, root), {
        page: new AetlanPages({ path: root }),
        documentation: new AetlanDocs({ path: root }),
      });

      const devServer = new DevServer(aetlan);
      devServer.run(root);
    });

  program
    .command('preview')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const cfgFile: any = yaml.load(fs.readFileSync(cfgPath).toString());
      const root = path.dirname(cfgPath);

      const aetlan = await Aetlan.create(root, makeTarget(cfgFile.target, root), {
        page: new AetlanPages({ path: root }),
        documentation: new AetlanDocs({ path: root }),
      });

      const previewServer = new Preview(aetlan);
      previewServer.run(root);
    });

  program.parse();
}
