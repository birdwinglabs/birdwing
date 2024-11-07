import Nabu from "@tashmet/nabu";
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Tashmet, { Database } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';
import { terminal } from '@tashmet/terminal';

import path from 'path';

export async function createStorageEngine(): Promise<StorageEngine> {
  return Nabu
    .configure({
      logLevel: LogLevel.Info,
      logFormat: terminal(),
    })
    .use(mingo())
    .bootstrap();
}

export async function createDatabase(store: StorageEngine, root: string, dev: boolean): Promise<Database> {
  const tashmet = await Tashmet.connect(store.proxy());
  const db = tashmet.db('birdwing');

  await db.createCollection('source', {
    storageEngine: {
      glob: {
        pattern: path.join(root, '**/*.md'),
        format: {
          frontmatter: {
            format: 'yaml',
          }
        },
        construct: {
          path: {
            $relativePath: [root, '$_id']
          }
        },
      }
    }
  });
  await db.createCollection('images', {
    storageEngine: {
      glob: {
        pattern: path.join(root, 'pages/**/*.{svg,jpg,png}'),
        format: 'text',
        construct: {
          path: {
            $relativePath: [root, '$_id']
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
