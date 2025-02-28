import { ComponentType, PropertyNodes } from "../interfaces.js";
import { Menu } from "./menu.js";

export class PageSection {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
}

export interface PageSectionProperties extends PropertyNodes<PageSection> {
  name: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
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
