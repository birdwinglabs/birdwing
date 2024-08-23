import { Schema } from '@markdoc/markdoc';

export const footer: Schema = {
  render: 'Footer',
  children: ['heading', 'link', 'list', 'paragraph'],
}
