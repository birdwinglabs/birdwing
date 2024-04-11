import markdoc from '@markdoc/markdoc';

const { Tag } = markdoc;

export function makeLink(customTags: string[], summary: boolean) {
  return {
    transform(node: any, config: any) {
      const { slug, slugMap } = config.variables || {};

      let tag = 'a';

      if (summary && customTags.includes('SummaryLink')) {
        tag = 'SummaryLink';
      }

      if (!summary && customTags.includes('Link')) {
        tag = 'Link';
      }

      if (slug && slugMap) {
        if (node.attributes.href in slugMap) {
          const href = slugMap[node.attributes.href];
          return new Tag(tag, { href, selected: href === slug }, node.transformChildren(config));
        }
      }
      return new Tag(tag, node.attributes, node.transformChildren(config));
    }
  }
}
