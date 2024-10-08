import { Template } from '@birdwing/react';
import { Schema } from '@markdoc/markdoc';

export const page: Schema = {
  render: 'Page',
}

export class Page extends Template<any> {}
