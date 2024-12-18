import {
  FenceProps,
  GridProps,
  HeadingProps,
  ItemProps,
  LinkProps,
  ListProps,
  NodeProps,
  ParagraphProps,
  SectionProps,
  Selector,
  TileProps
} from "./interfaces";

function layout<T extends NodeProps = NodeProps>(attr?: Partial<T>) { return new Selector<T>('layout').withAttr(attr || {}) };
const section = (name?: string) => new Selector<SectionProps>('section').withAttr({ name });
const grid = (name?: string) => new Selector<GridProps>('grid').withAttr({ name });
const tile = (name?: string) => new Selector<TileProps>('tile').withAttr({ name });
const heading = new Selector<HeadingProps>('heading');
const paragraph = new Selector<ParagraphProps>('paragraph');
const hr = new Selector<NodeProps>('hr');
const image = new Selector<NodeProps>('image');
const fence = new Selector<FenceProps>('fence');
const html = new Selector<NodeProps>('html');
const blockquote = new Selector<NodeProps>('blockquote');
const list = new Selector<ListProps>('list');
const item = new Selector<ItemProps>('item');
const strong = new Selector<NodeProps>('strong');
const link = new Selector<LinkProps>('link');
const code = new Selector<NodeProps>('code');

export const selectors = {
  layout,
  section,
  grid,
  tile,
  heading,
  paragraph,
  hr,
  image,
  fence,
  html,
  blockquote,
  list,
  item,
  strong,
  link,
  code,

  h1: heading.withAttr({ level: 1 }),
  h2: heading.withAttr({ level: 2 }),
  h3: heading.withAttr({ level: 3 }),
  h4: heading.withAttr({ level: 4 }),
  h5: heading.withAttr({ level: 5 }),
  h6: heading.withAttr({ level: 6 }),

  tabGroup: section('tab-group'),
  tabs: list.withClass('tabs'),
  tab: item.withClass('tab'),
  tabPanels: list.withClass('tab-panels'),
  tabPanel: item.withClass('tab-panel'),
};
