import { ComponentType } from "../interfaces.js";
import { Page, PageProperties } from "./page.js";
import { SequentialPagination } from "./pagination.js";

export class DocPage extends Page {
  topic: string = '';
  pagination: SequentialPagination = new SequentialPagination();
  headings: Headings | undefined = undefined;
  summary: TableOfContents | undefined = undefined;
}

export interface DocPageProperties extends PageProperties {
  topic: 'h2',
  pagination: 'nav',
  headings: 'aside',
  summary: 'nav',
}

export interface DocPageComponent extends ComponentType<DocPage> {
  tag: 'document',
  properties: DocPageProperties,
  refs: {
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
  refs: {},
}
