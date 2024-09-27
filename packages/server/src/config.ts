import yaml from 'js-yaml';
import fs from 'fs';
import { AppConfig } from '@aetlan/core';

/** TODO: Validate input */
export function loadAppConfig(file: string): AppConfig {
  return yaml.load(fs.readFileSync(file).toString()) as AppConfig;
}
