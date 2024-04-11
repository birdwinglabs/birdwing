import { makeHeading } from "./heading.js";
import { makeLink } from './link.js';

export function makeNodes(customTags: string[], summary: boolean = false) {
  const nodes: any = {
    heading: makeHeading(customTags, summary),
    link: makeLink(customTags, summary),
  }

  if (!summary) {
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
  }

  return nodes;
}
