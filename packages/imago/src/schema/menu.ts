import { ComponentType } from "../interfaces";

export class Menu {}

export interface MenuComponent extends ComponentType<Menu> {
  tag: 'nav',
  properties: {},
  slots: {},
}
