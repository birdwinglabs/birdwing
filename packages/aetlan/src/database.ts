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

export async function createDatabase(store: StorageEngine, root: string): Promise<Database> {
  const tashmet = await Tashmet.connect(store.proxy());
  const db = tashmet.db('aetlan');
  const pagesPath = path.join(root, 'src/pages');

  await db.createCollection('pagesource', {
    storageEngine: {
      glob: {
        pattern: path.join(pagesPath, '**/*.md'),
        format: {
          frontmatter: {
            format: 'yaml',
          }
        },
        construct: {
          path: {
            $relativePath: [pagesPath, '$_id']
          }
        },
      }
    }
  });
  await db.createCollection('pagecache');
  await db.createCollection('routes');
  await db.createCollection('devtarget');
  await db.createCollection('buildtarget', {
    storageEngine: {
      glob: {
        pattern: path.join(root, 'out', '**/*'),
        format: 'text',
      }
    }
  });

  return db;
}
