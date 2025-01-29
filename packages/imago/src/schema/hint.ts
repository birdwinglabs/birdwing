import { ComponentType } from "../interfaces";

export class Hint {
  hintType: 'check' | 'note' | 'warning' | 'caution' = 'note';
}

export interface HintComponent extends ComponentType<Hint> {
  tag: 'section',
  properties: {
    hintType: 'meta',
  },
  refs: {
    body: 'section',
  }
}
