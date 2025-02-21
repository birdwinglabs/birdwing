import { ComponentType } from "../interfaces.js";

export class Footer {}

export interface FooterComponent extends ComponentType<Footer> {
  tag: 'footer',
  properties: {},
  refs: {},
}
