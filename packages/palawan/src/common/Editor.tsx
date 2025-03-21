import { HeadlessUITabs, Tailwind, createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

const style = {
  editor: [
    "editor ring-1",
    "relative overflow-hidden shadow-lg flex sm:rounded-xl",

    // Height
    "h-[31.625rem]", 
    "max-h-[60vh]",
    "sm:max-h-[none]",
    "lg:h-[34.6875rem]",
    "xl:h-[31.625rem]",
    "!h-auto max-h-[none]",

    // Light
    "bg-white",
    "ring-stone-300",

    // Dark
    "dark:bg-primary-900",
    "dark:ring-primary-500",
    "dark:backdrop-blur dark:ring-1 dark:ring-inset",
  ],
  tab: [
    'flex flex-col px-4 outline-none text-sm pt-4 pb-2.5 -mb-px border-b, min-w-24',

    'data-[selected]:font-semibold',

    // Light
    'text-stone-500',
    'hover:text-stone-700',
    'data-[selected]:text-secondary-600',
    'data-[selected]:border-secondary-600',

    // Dark
    'dark:data-[selected]:bg-primary-700',
    'dark:text-white/60',
    'dark:hover:text-white',
    'dark:hover:data-[selected]:text-secondary-400',
  ],
  tabs: [
    "flex text-sm border-b",
    // Light
    "text-white bg-primary-50 border-primary-100",
    // Dark
    "dark:bg-primary-800 dark:border-primary-500 dark:border-x"
  ],
}

export const Tab = createComponent(schema.Tab, {
  class: style.tab.join(' '),
  render: HeadlessUITabs.Tab,
});

export const TabPanel = createComponent(schema.TabPanel, {
  class: 'h-full dark:text-white',
  tags: {
    pre: 'min-h-full',
    code: {
      class: 'flex-auto relative block dark:text-slate-50 overflow-auto p-4',
    }
  },
  render: HeadlessUITabs.TabPanel,
});

export const TabGroup = createComponent(schema.TabGroup, {
  class: "relative min-h-0 h-full flex-auto flex flex-col",
  refs: {
    tabs: {
      class: style.tabs.join(' '),
      render: HeadlessUITabs.TabList,
    },
    panels: {
      class: 'w-full relative flex-auto overflow-auto',
      render: HeadlessUITabs.TabPanels,
    }
  },
  render: HeadlessUITabs.TabGroup,
})
  .useComponent(Tab)
  .useComponent(TabPanel)

export const Editor = createComponent(schema.Editor, {
  use: [Tailwind],
  class: style.editor.join(' '),
  children: ({ Slot }) => (
    <div className="relative min-h-0 flex-auto flex flex-col">
      <div className="flex-none border-b border-stone-200 dark:border-primary-500">
        <div className="flex items-center h-8 space-x-1.5 px-3">
          <div className="w-2.5 h-2.5 bg-primary-100 dark:bg-primary-700 rounded-full shadow-inner"></div>
          <div className="w-2.5 h-2.5 bg-primary-100 dark:bg-primary-700 rounded-full shadow-inner"></div>
          <div className="w-2.5 h-2.5 bg-primary-100 dark:bg-primary-700 rounded-full shadow-inner"></div>
        </div>
      </div>
      <Slot/>
    </div>
  ),
  tags: {
    div: "divide-x divide-y dark:divide-primary-700",
  }
})
  .useComponent(TabGroup)
