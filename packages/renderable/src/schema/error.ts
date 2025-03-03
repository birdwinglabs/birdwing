import { ComponentType } from "../interfaces.js";

export class Error {
  code: string;
  tag: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
}

export interface ErrorComponent extends ComponentType<Error> {
  tag: 'section',
  properties: {
    code: 'span',
    tag: 'span',
    level: 'meta',
    message: 'p',
  },
}
