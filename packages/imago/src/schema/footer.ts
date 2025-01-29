import { ComponentType } from "../interfaces";

export class Footer {}

export interface FooterComponent extends ComponentType<Footer> {
  tag: 'footer',
  properties: {},
  slots: {},
}
