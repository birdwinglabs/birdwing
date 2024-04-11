import markdoc from '@markdoc/markdoc';
import { makeHeading } from "./heading.js";

export function makeNodes(customTags: string[], summary: boolean = false) {
  const nodes: any = {};

  if (!summary) {
    nodes.heading = makeHeading(customTags.includes('Heading'));

    if (customTags.includes('Paragraph')) {
      nodes.paragraph = {
        render: 'Paragraph',
      }
    }

    if (customTags.includes('List')) {
      nodes.list = {
        render: 'List',
        attributes: {
          ordered: {
            type: Boolean
          }
        }
      }
    }

    if (customTags.includes('Link')) {
      nodes.link = {
        render: 'Link',
        attributes: {
          href: {
            type: String
          },
          title: {
            type: String
          }
        }
      };
    }

    if (customTags.includes('Fence')) {
      nodes.fence = {
        render: 'Fence',
        attributes: {
          content: {
            type: String
          },
          language: {
            type: String
          },
          process: {
            type: Boolean
          }
        }
      };
    }
  } else {
    if (customTags.includes('Summary')) {
      nodes.document = {
        render: 'Summary',
      }
    }

    if (customTags.includes('SummaryList')) {
      nodes.list = {
        render: 'SummaryList'
      }
    }

    if (customTags.includes('SummaryItem')) {
      nodes.item = {
        render: 'SummaryItem'
      }
    }

    nodes.link = {
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
            return new markdoc.Tag(tag, { href, selected: href === slug }, node.transformChildren(config));
          }
        }
        return new markdoc.Tag(tag, node.attributes, node.transformChildren(config));
      }
    }
  }

  return nodes;
}
