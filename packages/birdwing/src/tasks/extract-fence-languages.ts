import { AbstractDocument } from '@birdwing/core';

import { Task } from '../command.js';
import { allAncestorsOfType } from '../util.js';

export class ExtractFenceLanguagesTask extends Task<string[]> {
  constructor(private documents: AbstractDocument[]) {
    super({
      start: 'Extracting fence node languages...',
      success: langs => `Extracted ${langs.length} languages for highlighting`,
    })
  }

  async *execute() {
    const languages = new Set<string>();
    for (const doc of this.documents) {
      const fences = allAncestorsOfType(doc.ast, 'fence');
      for (const fence of fences) {
        const lang = fence.attributes.language;
        if (lang && lang !== '') {
          languages.add(lang);
        }
      }
    }
    return Array.from(languages);
  }
}
