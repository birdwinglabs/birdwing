import { program } from 'commander';
import { Build, DevServer, Preview } from '@aetlan/server';
import path from 'path';
import docs from '@aetlan/docs';
import pages from '@aetlan/pages';
import yaml from 'js-yaml';
import fs from 'fs';
import { AetlanConfig } from '@aetlan/aetlan/dist/aetlan';
import { tags, nodes, documents } from '@aetlan/schema';
import { ContentMountPoint } from '@aetlan/aetlan/dist/loader';

interface ConfigFile {
  content: ContentMountPoint[];
}

function configure(file: string): AetlanConfig {
  const configFile = yaml.load(fs.readFileSync(file).toString()) as ConfigFile;
  //const pluginCtx = new PluginContext([docs(), pages()]);
  return {
    tags,
    nodes,
    documents,
    plugins: [docs(), pages()],
    content: configFile.content,
  };
}

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const build = await Build.create(path.dirname(cfgPath), configure(cfgPath));
      await build.run();
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const devServer = await DevServer.create(path.dirname(cfgPath), configure(cfgPath));
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
