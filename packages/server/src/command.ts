import path from 'path';
import { AppConfig } from "@aetlan/core";
import { Logger } from "./logger.js";
import { Theme } from "./theme.js";


export abstract class Command {
  constructor(
    protected root: string,
    protected logger: Logger,
    protected config: AppConfig
  ) {}

  abstract execute(): Promise<void>;

  async loadTheme() {
    try {
      this.logger.start('Loading theme...');
      const theme = await Theme.load(path.join(this.root, this.config.theme || 'theme', 'theme.config.ts'));
      this.logger.success(`Loaded theme: ${theme.path}`);
      return theme;
    } catch (err) {
      this.logger.error('Failed to load theme');
      throw err;
    }
  }
}
