import { ComponentType } from "../interfaces";

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
  slots: {}
}

export interface StepComponent extends ComponentType<Step> {
  tag: 'li',
  properties: {
    name: 'h1',
  },
  slots: {}
}
