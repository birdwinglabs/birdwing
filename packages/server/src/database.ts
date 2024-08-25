import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Database } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';

import markdocPlugin from './markdoc.js';
import path from 'path';

export async function createStorageEngine(): Promise<StorageEngine> {
  return Nabu
    .configure({
      logLevel: LogLevel.Info,
      logFormat: terminal(),
    })
    .use(mingo())
    .use(markdocPlugin())
    .bootstrap();
}

export async function createDatabase(store: StorageEngine, root: string, dev: boolean): Promise<Database> {
  const tashmet = await Tashmet.connect(store.proxy());
  const db = tashmet.db('aetlan');
  const pagesPath = path.join(root, 'src/pages');
  const srcPath = path.join(root, 'src');

  await db.createCollection('source', {
    storageEngine: {
      glob: {
        pattern: path.join(srcPath, '**/*.md'),
        format: {
          frontmatter: {
            format: 'yaml',
          }
        },

        construct: {
          path: {
            $relativePath: [srcPath, '$_id']
          }

        },
      }
    }
  });
  await db.createCollection('pages');
  await db.createCollection('partials');
  await db.createCollection('routes');

  const targetOptions = dev
    ? undefined
    : {
        storageEngine: {
          glob: {
            pattern: path.join(root, 'out', '**/*'),
            format: 'text',
          }
        }
      };

  await db.createCollection('target', targetOptions);

  return db;
}
