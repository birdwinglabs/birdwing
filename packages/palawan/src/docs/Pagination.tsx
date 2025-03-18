import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

export const Pagination = createComponent(schema.SequentialPagination, node => ({
  class: `flex py-12 ${node.data.previousPage ? 'justify-between' : 'justify-end'}`,
  properties: {
    nextPage: {
      class: 'text-sm text-stone-800 dark:text-white hover:text-primary-400 font-bold flex',
      childAfter: <span className="-mt-0.5 material-symbols-outlined">chevron_right</span>
    },
    previousPage: {
      class: 'text-sm text-stone-800 dark:text-white hover:text-primary-400 font-bold flex',
      childBefore: <span className="-mt-0.5 material-symbols-outlined">chevron_left</span>
    }
  },
}));
