import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AetlanDocs } from '@aetlan/docs';
import sveltekit from '@aetlan/sveltekit';


export function makeTarget(type: string, root: string) {
  switch (type) {
    case 'sveltekit':
      return sveltekit({
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

      const aetlan = new Aetlan();
      for (const source of cfgFile.sources) {
        aetlan.pipeline({
          name: source.type,
          source: makeSource(source.type, root, source),
          target: makeTarget(cfgFile.target, root),
          components: source.components,
          postrender: source.postrender,
        });
      }

      aetlan.run(root);
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (src: string, dst: string) => {
      //await svelteKitCompiler(src, dst, aetlan => aetlan.watch());
    });

  program.parse();
}
