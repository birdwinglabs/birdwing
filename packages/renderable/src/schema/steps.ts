import { ComponentType } from "../interfaces.js";

export class Steps {
  step: Step[] = [];
}

export class Step {
  name: string = '';
}

export interface StepsComponent extends ComponentType<Steps> {
  tag: 'ol',
  properties: {
    step: 'li',
  },
  refs: {}
}

export interface StepComponent extends ComponentType<Step> {
  tag: 'li',
  properties: {
    name: 'h1',
  },
  refs: {}
}
