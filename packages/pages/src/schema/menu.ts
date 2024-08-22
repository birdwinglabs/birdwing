import { Schema } from '@markdoc/markdoc';

export const menu: Schema = {
  render: 'Menu',
  children: ['heading', 'link', 'list'],
}
