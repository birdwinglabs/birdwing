import {
  AbstractDocument,
  FragmentDocument,
  PageDocument,
  PartialDocument,
  SourceDocument
} from "@aetlan/core";

import Markdoc from '@markdoc/markdoc';

export class ContentParser {
  parse({ path, body, frontmatter }: SourceDocument): AbstractDocument | null {
    const ast = Markdoc.parse(body);

    const match = /^(.+?)\/(((.+?)\/)?(([^\/]+).md$))/.exec(path);
    if (match) {
      const folder = match[1];
      const path = match[2];
      const basename = match[6];

      if (folder === 'partials') {
        return new PartialDocument(path, frontmatter, ast);
      }

      if (folder === 'pages') {
        const type = basename.toUpperCase() === basename && basename !== 'README'
          ? 'fragment'
          : 'page';

        if (type === 'fragment') {
          return new FragmentDocument(path, frontmatter, ast);
        } else {
          return new PageDocument(path, frontmatter, ast);
        }
      }
    }

    return null;
  }
}
