import { Selector } from './selector.js';

const document = new Selector('document');
const value = new Selector('value');
const section = new Selector('section');
const grid = new Selector('grid');
const tile = new Selector('tile');
const heading = new Selector('heading');
const paragraph = new Selector('paragraph');
const hr = new Selector('hr');
const image = new Selector('image');
const fence = new Selector('fence');
const html = new Selector('html');
const blockquote = new Selector('blockquote');
const list = new Selector('list');
const item = new Selector('item');
const strong = new Selector('strong');
const link = new Selector('link');
const code = new Selector('code');

export const schema = {
  // Nodes
  document,
  value,
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

  h1: heading.attr({ level: 1 }),
  h2: heading.attr({ level: 2 }),
  h3: heading.attr({ level: 3 }),
  h4: heading.attr({ level: 4 }),
  h5: heading.attr({ level: 5 }),
  h6: heading.attr({ level: 6 }),

  // Types
  Page: document.typeof('bw:Page'),
  DocPage: document.typeof('bw:DocPage'),
  CallToAction: new Selector(['section', 'grid']).typeof('bw:CallToAction'),
  Feature: new Selector(['section', 'grid']).typeof('bw:Feature'),
  HintNote: section.typeof('bw:HintNote'),
  HintCheck: section.typeof('bw:HintCheck'),
  HintWarning: section.typeof('bw:HintWarning'),
  HintCaution: section.typeof('bw:HintCaution'),
  Steps: list.typeof('bw:Steps'),
  Editor: section.typeof('bw:Editor'),
  TableOfContents: section.typeof('bw:TableOfContents'),
  PageBody: section.typeof('bw:PageBody'),
  PageContentSection: section.typeof('bw:PageContentSection'),
  Pricing: section.typeof('bw:Pricing'),
  Tier: tile.typeof('bw:Tier'),
  FeaturedTier: tile.typeof('bw:FeaturedTier'),
  MusicPlaylist: section.typeof('MusicPlaylist'),
  TabGroup: section.typeof('bw:TabGroup'),
  TabPanels: list.typeof('bw:TabPanels'),
  TabPanel: item.typeof('bw:TabPanel'),
  TabList: list.typeof('bw:TabList'),
  Tab: item.typeof('bw:Tab'),

  // Properties
  tier: tile.property('bw:tier'),
  tabs: list.property('bw:tabs'),
  tab: item.property('bw:tab'),
  panel: item.property('bw:panel'),
  panels: list.property('bw:panels'),
  step: item.property('bw:step'),
  menu: section.property('bw:menu'),
  body: section.property('bw:body'),
  headings: section.property('bw:headings'),
  summary: section.property('bw:summary'),
  footer: section.property('bw:footer'),
  pagination: section.property('bw:pagination'),
  previousPage: link.property('bw:previousPage'),
  nextPage: link.property('bw:nextPage'),
}
