import { ComponentType } from "../interfaces.js";

export class Menu {}

export interface MenuComponent extends ComponentType<Menu> {
  tag: 'nav',
  properties: {},
  refs: {},
}
