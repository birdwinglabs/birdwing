import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

import * as ui from '../Common';

export const DocLinkItem = createComponent(schema.LinkItem, {
  properties: {
    name: {
      render: ({ children }) => children,
    }
  },
  tags: {
    a: ui.navLink({
      class: "block text-sm pl-4 ml-2 py-2 border-l",
      classInactive: [
        "hover:text-primary-400 dark:hover:text-white",
        "text-stone-600 dark:text-primary-300",
        "dark:border-primary-800",
      ].join(' '),
      classActive: [
        "font-bold",
        "bg-primary-100 dark:bg-primary-900",
        "text-secondary-600 dark:text-secondary-400",
        "border-secondary-600 dark:border-secondary-400",
      ].join(' ')
    })
  }
})

export const DocTopic = createComponent(schema.Topic, {
  properties: {
    name: 'dark:text-stone-50 my-4 uppercase text-sm',
  },
})
  .useComponent(DocLinkItem)

export const DocTableOfContents = createComponent(schema.TableOfContents, {
  class: 'py-8',
  properties: {
    headline: { render: () => '' },
  },
})
  .useComponent(DocTopic)
