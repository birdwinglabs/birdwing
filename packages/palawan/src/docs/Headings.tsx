import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

export const DocHeadings = createComponent(schema.Headings, {
  properties: {
    headline: "font-semibold text-lg pb-4 dark:text-white",
  },
  class: "fixed z-20 top-[3.8125rem] bottom-0 right-[max(0px,calc(50%-45rem))] w-[19.5rem] py-10 overflow-y-auto hidden xl:block",
  children: ({ children }) => (
    <div className="hidden 2xl:block fixed z-20 overflow-y-auto h-full">
      { children }
    </div>
  ),
})
  .useComponent(schema.LinkItem, {
    properties: {
      url: url => ({
        render: ({children}: any) => <a href={url.data} className="table align-middle">{children}</a>
      })
    },
    tags: {
      h1: "text-sm font-medium mt-4 dark:text-primary-200 dark:hover:text-white",
      h2: {
        class: "flex text-xs font-light mt-2 dark:text-primary-300 dark:hover:text-white",
        childBefore: <span className="material-symbols-outlined -mt-1">chevron_right</span>
      },
    }
  })
