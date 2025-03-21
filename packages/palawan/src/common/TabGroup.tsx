import { schema } from "@birdwing/renderable";
import * as ui from '../Common';
import { createComponent, HeadlessUITabs } from "@birdwing/imago";
import { ImagoComponentFactory } from "@birdwing/imago/dist/Component";
import { PageSectionComponent } from "@birdwing/renderable/dist/schema/page";
import { Editor } from "./Editor";
import { Grid } from "./Grid";

const style = {
  tab: [
    // Layout
    'flex flex-col',
    'outline-none',
    'border-b border-transparent',
    '-mb-px',
    'pt-4 pb-2.5',

    // Typography
    'text-sm font-semibold',

    // Light
    'text-slate-900',
    'data-[selected]:border-secondary-600',
    'data-[selected]:text-secondary-600',

    // Dark
    'dark:text-slate-200', 
    'dark:data-[selected]:border-secondary-400',
    'dark:data-[selected]:bg-primary-900',
    'dark:hover:border-secondary-800',
  ],
  tabs: [
    "flex gap-12",
    "lg:-mx-6 sm:-mx-4 mt-8",
    "px-6 2xl:px-8 3xl:px-10",
  ],
  panels: [
    "relative",
    "py-8 mb-8",
    "prose prose-slate dark:prose-dark",
    "bg-primary-50",
    "border-y border-primary-300",
  ]
}

export const Tab = createComponent(schema.Tab, {
  class: style.tab.join(' '),
  properties: {
    name: 'w-full text-center',
    image: 'w-full mx-auto block text-center',
  },
  render: HeadlessUITabs.Tab,
});

export const TabPanel = createComponent(schema.TabPanel, {
  tags: ui.tags,
  render: HeadlessUITabs.TabPanel,
})
  .useComponent(Grid)
  .useComponent(Editor)

export interface TabGroupOptions {
  Base: ImagoComponentFactory<PageSectionComponent>;

  Container: React.FunctionComponent<any>;
}

export const TabGroup = ({ Base, Container }: TabGroupOptions) => Base.extend(schema.TabGroup, {
  tags: {
    header: {
      class: "lg:max-w-lg",
      parent: Container,
    }
  },
  refs: {
    tabs: {
      parent: Container,
      class: style.tabs.join(' '),
      render: HeadlessUITabs.TabList,
    },
    panels: {
      class: style.panels.join(' '),
      children: ({ children }) => (
        <>
          <div className="absolute pattern top-0 bottom-0 w-full"></div> 
          <Container>{ children }</Container>
        </>
      ),
      render: HeadlessUITabs.TabPanels,
    }
  },
  render: HeadlessUITabs.TabGroup,
})
  .useComponent(Tab)
  .useComponent(TabPanel)
