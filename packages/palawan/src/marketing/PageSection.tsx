import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { Editor } from '../common/Editor';

export const PageSection = createComponent(schema.PageSection, {
  class: "overflow-hidden dark:bg-primary-950 py-8 sm:py-12 my-12",
  properties: {
    eyebrow: `text-base leading-7 uppercase text-secondary-600 dark:text-secondary-400`,
    blurb: "mt-6 mb-12 text-lg leading-8 text-gray-700 dark:text-gray-300",
  },
  tags: {
    h1: "text-5xl mt-2 tracking-tight text-black dark:text-white sm:text-5xl",
    h2: "text-base font-semibold leading-7 text-secondary-400 dark:text-primary-300",
    img: "mb-12 border-secondary-400 border-1 rounded-lg shadow-xl",
  }
})
  .useComponent(Editor)
