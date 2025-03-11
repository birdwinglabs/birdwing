import { TableOfContents } from '@birdwing/renderable/dist/schema/docpage';

export interface SummaryLink {
  href: string;
  title: string;
  topic: string | undefined;
}

export interface SummaryPageData {
  title: string;
  topic: string | undefined;
  prev: SummaryLink | undefined;
  next: SummaryLink | undefined;
}

export function makeToc(toc: TableOfContents) {
  const links: SummaryLink[] = [];

  for (const topic of toc.topic) {
    for (const item of topic.item) {
      links.push({ href: item.url, title: item.name, topic: topic.name });
    }
  }
}

export function makeSummary(toc: TableOfContents) {
  const links: SummaryLink[] = [];

  for (const topic of toc.topic) {
    for (const item of topic.item) {
      links.push({ href: item.url, title: item.name, topic: topic.name });
    }
  }

  const prev = (i: number) => i >= 1 ? links[i - 1] : undefined;
  const next = (i: number) => i < (links.length - 1) ? links[i + 1] : undefined;

  return links.reduce((data, { href, title, topic }, i) => {
    data[href] = { title, topic, prev: prev(i), next: next(i) }
    return data;
  }, {} as Record<string, SummaryPageData>)
}
