import * as esbuild from 'esbuild';
import vm from 'vm';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { Schema } from '@markdoc/markdoc';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import { AetlanConfig } from '@aetlan/aetlan';
import { AppConfig, ThemeConfig } from '@aetlan/core';

export function loadAppConfig(file: string): AppConfig {
  return yaml.load(fs.readFileSync(file).toString()) as AppConfig;
}
