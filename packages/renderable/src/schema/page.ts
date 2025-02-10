import { ComponentType, PropertyNodes } from "../interfaces";
import { Menu } from "./menu";

export class PageSection {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  headline: string | undefined = undefined;
}

export interface PageSectionProperties extends PropertyNodes<PageSection> {
  name: 'p',
  headline: 'h1',
  description: 'p',
}

export interface PageSectionComponent extends ComponentType<PageSection> {
  tag: 'section',
  properties: PageSectionProperties,
}

export class Page {
  name: string = '';
  description: string = '';
  contentSection: PageSection[] = [];
  menu: Menu | undefined = undefined;
  footer: any = undefined;
}

export interface PageProperties extends PropertyNodes<Page> {
  name: 'h1',
  description: 'p',
  contentSection: 'section',
  menu: 'nav',
  footer: 'footer',
}

export interface PageComponent extends ComponentType<Page> {
  tag: 'document',
  properties: PageProperties,
  refs: {
    body: 'main',
  }
}
