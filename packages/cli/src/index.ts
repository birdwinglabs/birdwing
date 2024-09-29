import { program } from 'commander';
import { BuildCommand, Command, DevCommand, EditCommand, loadAppConfig, Logger, PreviewCommand } from '@birdwing/birdwing';
import path from 'path';
import { AppConfig } from '@birdwing/core';

interface CommandConstructor {
  new (root: string, logger: Logger, config: AppConfig): Command;
}

async function executeCommand(Cmd: CommandConstructor, cfgPath: string) {
  const root = path.dirname(cfgPath);
  const logger = new Logger();
  const config = loadAppConfig(cfgPath);

  const command = new Cmd(root, logger, config);

  try {
    return await command.execute();
  } catch (err) {
    logger.error(err.message);
  }
}

export function cli() {
  program
    .command('build')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await executeCommand(BuildCommand, cfgPath);
    });

  program
    .command('watch')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await executeCommand(DevCommand, cfgPath);
    });

  program
    .command('edit')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await executeCommand(EditCommand, cfgPath);
    });

  program
    .command('preview')
    .argument('<path>', 'path to config file')
    .action(async (cfgPath: string) => {
      await executeCommand(PreviewCommand, cfgPath);
    });

  program.parse();
}
