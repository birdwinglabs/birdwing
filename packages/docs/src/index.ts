import path from 'path';
import { Plugin } from '@aetlan/aetlan';
import { Summary } from './summary.js';
import { DocPage } from './docpage.js';

interface DocsConfig {
  path: string;
}

export default function(config: DocsConfig) {
  return new Plugin()
    .fragment(path.join(config.path, 'SUMMARY.md'), async (doc, urls) =>
      Summary.fromDocument(doc, config.path, urls)
    )
    .page(path.join(config.path, '**/*.md'), async doc => 
      new DocPage(doc, config.path)
    );
}
