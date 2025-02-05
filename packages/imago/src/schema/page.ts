import { ComponentType } from "../interfaces";
import { Menu } from "./menu";


export class PageSection {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  headline: string | undefined = undefined;
}

export interface PageSectionComponent extends ComponentType<PageSection> {
  tag: 'section',
  properties: {
    name: 'p',
    headline: 'h1',
    description: 'p',
  }
}

export class Page {
  name: string = '';
  description: string = '';
  contentSection: any[] = [];
  menu: Menu | undefined = undefined;
  footer: any = undefined;
}

export interface PageComponent extends ComponentType<Page> {
  tag: 'document',
  properties: {
    name: 'h1',
    description: 'p',
    contentSection: 'section',
    menu: 'nav',
    footer: 'footer',
  },
  refs: {
    body: 'main',
  }
}
