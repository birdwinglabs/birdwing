import { program } from 'commander';
import { Build, DevServer, Preview } from '@aetlan/server';
import path from 'path';
import docs from '@aetlan/docs';
import pages from '@aetlan/pages';
import yaml from 'js-yaml';
import fs from 'fs';
import { Plugin } from '@aetlan/aetlan';

interface Module {
  type: string;

  path: string;
}

interface ConfigFile {
  modules: Module[];
}

function parseConfig(file: string): ConfigFile {
  return yaml.load(fs.readFileSync(file).toString()) as ConfigFile;
}

function getPlugin(name: string, config: any) {
  switch (name) {
    case 'documentation':
      return docs(config);
    default:
      return null;
  }
}

function getPlugins(config: ConfigFile) {
  return config.modules.reduce((plugins, {type, ...cfg}) => {
    const plugin = getPlugin(type, cfg);
    if (plugin) {
      plugins.push(plugin);
    }
    return plugins;
  }, [] as Plugin[])
}

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const build = await Build.create(path.dirname(cfgPath), [
        ...getPlugins(parseConfig(cfgPath)),
        pages(),
      ]);
      await build.run();
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      const devServer = await DevServer.create(path.dirname(cfgPath), [
        ...getPlugins(parseConfig(cfgPath)),
        pages(),
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
