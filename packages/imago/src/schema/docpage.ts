import { ComponentType } from "../interfaces";
import { Page } from "./page";
import { SequentialPagination } from "./pagination";

export class DocPage extends Page {
  topic: string = '';
  pagination: SequentialPagination = new SequentialPagination();
  headings: Headings | undefined = undefined;
  summary: TableOfContents | undefined = undefined;
}

export interface DocPageComponent extends ComponentType<DocPage> {
  tag: 'document',
  properties: {
    name: 'h1',
    topic: 'h2',
    description: 'p',
    contentSection: 'section',
    pagination: 'nav',
    headings: 'aside',
    menu: 'nav',
    summary: 'nav',
    footer: 'footer',
  },
  slots: {
    body: 'article',
  }
}

export class Headings {
}

export interface HeadingsComponent extends ComponentType<Headings> {
  tag: 'aside'
}

export class TableOfContents {}

export interface TableOfContentsComponent extends ComponentType<TableOfContents> {
  tag: 'nav',
  properties: {},
  slots: {},
}
