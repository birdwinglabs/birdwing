import { Template } from '@birdwing/react';
import { Schema } from '@markdoc/markdoc';

export const docpage: Schema = {
  render: 'Documentation',
}

export class Documentation extends Template<any> {}
