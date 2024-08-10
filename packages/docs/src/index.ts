import path from 'path';
import { Plugin } from '@aetlan/aetlan';
import { Summary } from './summary.js';
import { DocPage } from './docpage.js';

interface DocsConfig {
  path: string;
}

export default function(config: DocsConfig) {
  const summaryPath = path.join(config.path, 'SUMMARY.md');

  return new Plugin()
    .fragment({ path: summaryPath }, async (doc, urls) =>
      Summary.fromDocument(doc, config.path, urls)
    )
    .page({
      match: {
        $and: [
          { path: { $regex: `^${config.path}\/` } },
          { path: { $ne: summaryPath } },
        ]
      },
    }, async doc => new DocPage(doc, config.path));
}
