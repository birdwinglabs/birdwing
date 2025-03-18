import { createComponent, createConfiguration } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

export function Container({ children }: any) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none">
        { children }
      </div>
    </div>
  );
}

export const PageSectionOptions = createConfiguration(schema.PageSection, {
  class: "overflow-hidden bg-primary-100 dark:bg-primary-950 py-8 sm:py-12 my-12",
  properties: {
    blurb: "mt-6 mb-12 text-lg leading-8 text-gray-700 dark:text-gray-300",
  },
  tags: {
    h1: "text-3xl mt-2 font-bold tracking-tight text-black dark:text-white sm:text-4xl",
    h2: "text-base font-semibold leading-7 text-secondary-400 dark:text-primary-300",
    img: "mb-12 border-secondary-400 border-1 rounded-lg shadow-xl",
  }
});

export const PageSection = createComponent(schema.PageSection, {
  class: "overflow-hidden bg-primary-100 dark:bg-primary-950 py-8 sm:py-12 my-12",
  properties: {
    blurb: "mt-6 mb-12 text-lg leading-8 text-gray-700 dark:text-gray-300",
  },
  tags: {
    h1: "text-3xl mt-2 font-bold tracking-tight text-black dark:text-white sm:text-4xl",
    h2: "text-base font-semibold leading-7 text-secondary-400 dark:text-primary-300",
    img: "mb-12 border-secondary-400 border-1 rounded-lg shadow-xl",
  }
});
