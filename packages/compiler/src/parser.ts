import {
  AbstractDocument,
  FragmentDocument,
  PageDocument,
  PartialDocument,
  SourceDocument
} from "@birdwing/core";

import Markdoc from '@markdoc/markdoc';

const { Tokenizer } = Markdoc;

export class ContentParser {
  private tokenizer = new Tokenizer({ allowComments: true });

  parse({ _id, path, body, frontmatter }: SourceDocument): AbstractDocument | null {
    const tokens = this.tokenizer.tokenize(body);
    const ast = Markdoc.parse(tokens);

    const match = /^(.+?)\/(((.+?)\/)?(([^\/]+).md$))/.exec(path);
    if (match) {
      const folder = match[1];
      const path = match[2];
      const basename = match[6];

      if (folder === 'partials') {
        return new PartialDocument(_id, path, frontmatter, ast);
      }

      if (folder === 'pages') {
        const type = basename.toUpperCase() === basename && basename !== 'README'
          ? 'fragment'
          : 'page';

        if (type === 'fragment') {
          return new FragmentDocument(_id, path, frontmatter, ast);
        } else {
          return new PageDocument(_id, path, frontmatter, ast);
        }
      }
    }

    return null;
  }
}
