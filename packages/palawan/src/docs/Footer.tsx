import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

import { tags } from '../Common';

export const Footer = createComponent(schema.Footer, {
  tags,
  render: ({ Slot }) => (
    <footer className="border-t border-stone-200 dark:border-secondary-900 py-8">
      <Slot/>
    </footer>
  )
});
