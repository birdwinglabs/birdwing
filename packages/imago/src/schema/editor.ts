import { ComponentType } from "../interfaces";
import { TabGroup } from "./tabs";

export class Editor {
  tabs: TabGroup[] = [];
}

export interface EditorComponent extends ComponentType<Editor> {
  tag: 'section',
  properties: {
    tabs: 'section',
  },
  slots: {
    area: 'div',
  },
}
