import { Tailwind, createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { Container} from '../Common';
import { PageSection } from './PageSection';

export const FeatureDefinition = createComponent(schema.FeatureDefinition, {
  class: "my-8 dark:text-gray-400 relative pl-12",
  properties: {
    name: "inline font-bold text-black dark:text-white mr-2",
    description: "inline",
  },
  tags: {
    svg: `absolute left-0 top-1 w-8 -mt-4 text-secondary-600 dark:text-secondary-400`,
  },
});

export const Feature = PageSection.extend(schema.Feature, node => ({
  class: 'mx-1 my-24',
  use: [Tailwind],
  parent: Container,
  refs: {
    body: 'mt-12',
    layout: node.hasClass('split') ? 'gap-12' : '',
    showcase: '',
  },
  tags: {
    header: node.hasClass('split') ? '' : 'mx-auto max-w-3xl text-center',
    p: "mt-6 text-lg leading-8 text-gray-700 dark:text-gray-300",
    dl: "my-12 gap-12",
  },
}));
