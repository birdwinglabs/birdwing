import { ComponentType, NodeMap, NodeType, Property, Newable } from './interfaces.js';
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


export class Type<T extends ComponentType<any>> {
  constructor(
    public readonly name: string,
    public readonly tag: T["tag"],
    private schemaCtr: Newable<T["schema"]>,
  ) {}

  create() {
    return new this.schemaCtr();
  }
}

export class Menu {}

export interface MenuComponent extends ComponentType<Menu> {
  tag: 'section',
  properties: {},
  slots: {},
}

export class Footer {}

export interface FooterComponent extends ComponentType<Footer> {
  tag: 'section',
  properties: {},
  slots: {},
}

export class Page {
  name: string = '';
  description: string = '';
  contentSection: any[] = [];
  menu: Menu | undefined = undefined;
  footer: any = undefined;
}

export interface PageComponent extends ComponentType<Page> {
  tag: 'document',
  properties: {
    name: 'heading',
    description: 'paragraph',
    contentSection: 'section',
    menu: 'section',
    footer: 'section',
  },
  slots: {
    body: 'section',
  }
}

export class DocPage extends Page {
  topic: string = '';
  pagination: SequentialPagination = new SequentialPagination();
  headings: Headings | undefined = undefined;
  summary: TableOfContents | undefined = undefined;
}

export interface DocPageComponent extends ComponentType<DocPage> {
  tag: 'document',
  properties: {
    name: 'heading',
    topic: 'heading',
    description: 'paragraph',
    contentSection: 'section',
    pagination: 'section',
    headings: 'section',
    menu: 'section',
    summary: 'section',
    footer: 'section',
  },
  slots: {
    body: 'section',
  }
}

export function defineType<T extends ComponentType<any>>(name: string, tag: T["tag"], schemaCtr: Newable<T["schema"]>) {
  return new Type<T>(name, tag, schemaCtr);
}

class SequentialPagination {
  nextPage: string | undefined = undefined;
  previousPage: string | undefined = undefined
}

export interface SequentialPaginationComponent extends ComponentType<SequentialPagination> {
  tag: 'section',
  properties: {
    nextPage: 'link',
    previousPage: 'link',
  },
  slots: {}
}

class Hint {
  hintType: 'check' | 'note' | 'warning' | 'caution' = 'note';
}

export interface HintComponent extends ComponentType<Hint> {
  tag: 'section',
  properties: {
    hintType: 'value',
  },
  slots: {
    body: 'section',
  }
}

class TabGroup {
  tab: Tab[] = [];
  panel: TabPanel[] = [];
}

export interface TabGroupComponent extends ComponentType<TabGroup> {
  tag: 'section',
  properties: {
    tab: 'item',
    panel: 'item',
  },
  slots: {
    tabs: 'list',
    panels: 'list',
  }
}

class TabPanel {}

interface TabPanelComponent extends ComponentType<TabPanel> {
  tag: 'item',
  properties: {},
  slots: {}
}

class Tab {
  name: string = '';
  image: string | undefined = undefined;
}

interface TabComponent extends ComponentType<Tab> {
  tag: 'item',
  properties: {
    name: 'heading',
    image: 'image',
  }
}

class Headings {
}

interface HeadingsComponent extends ComponentType<Headings> {
  tag: 'section'
}

class TableOfContents {}

export interface TableOfContentsComponent extends ComponentType<TableOfContents> {
  tag: 'section',
  properties: {},
  slots: {},
}

class Steps {
  step: Step[] = [];
}

class Step {
  name: string = '';
}

export interface StepsComponent extends ComponentType<Steps> {
  tag: 'list',
  properties: {
    step: 'item',
  },
  slots: {}
}

export interface StepComponent extends ComponentType<Step> {
  tag: 'item',
  properties: {
    name: 'heading',
  },
  slots: {}
}

export class MusicRecording {
  name: string = '';
  byArtist: string = '';
  duration: string = '';
  copyrightYear: number | undefined;
}

export class MusicPlaylist {
  track: MusicRecording[] = [];
}

export interface MusicRecordingComponent extends ComponentType<MusicRecording> {
  tag: 'item',
  properties: {
    name: 'heading',
    byArtist: 'value',
    duration: 'value',
    copyrightYear: 'value',
  }
}

export interface MusicPlaylistComponent extends ComponentType<MusicPlaylist> {
  tag: 'section',
  properties: {
    track: 'item',
  },
  slots: {
    tracks: 'list',
  }
}

class Action {
  url: string = '';
  name: string = '';
}

export interface ActionComponent extends ComponentType<Action> {
  tag: 'item',
  properties: {
    name: 'value',
    url: 'link',
  },
  slots: {},
}

class CallToAction {
  action: Action[] = [];
}

class Feature {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  tabs: TabGroup | undefined = undefined;
}

export interface FeatureComponent extends ComponentType<Feature> {
  tag: 'section',
  properties: {
    name: 'heading',
    headline: 'heading',
    description: 'paragraph',
    tabs: 'section',
  },
  slots: {
    body: 'section',
    showcase: 'section',
  },
}

class Editor {
  tabs: TabGroup[] = [];
}

export interface EditorComponent extends ComponentType<Editor> {
  tag: 'section',
  properties: {
    tabs: 'section',
  },
  slots: {
    area: 'tile',
  },
}

export interface CallToActionComponent extends ComponentType<CallToAction> {
  tag: 'section',
  properties: {
    action: 'item',
  },
  slots: {
    head: 'section',
    body: 'section',
    actions: 'section',
    showcase: 'tile',
  }
}

export class Tier {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  price: string | undefined = undefined;
}

export interface TierComponent extends ComponentType<Tier> {
  tag: 'tile',
  properties: {
    name: 'heading',
    description: 'paragraph',
    price: 'paragraph',
  },
  slots: {}
}

export class Pricing {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  tier: Tier[] = [];
}

export interface PricingComponent extends ComponentType<Pricing> {
  tag: 'section',
  properties: {
    name: 'heading',
    headline: 'heading',
    description: 'paragraph',
    tier: 'tile',
  },
  slots: {}
}

export const schema = {
  Page: defineType<PageComponent>('Page', 'document', Page),
  DocPage: defineType<DocPageComponent>('DocPage', 'document', DocPage),
  Headings: defineType<HeadingsComponent>('Headings', 'section', Headings),
  Hint: defineType<HintComponent>('Hint', 'section', Hint),
  Menu: defineType<MenuComponent>('Menu', 'section', Menu),
  SequentialPagination: defineType<SequentialPaginationComponent>('SequentialPagination', 'section', SequentialPagination),
  Steps: defineType<StepsComponent>('Steps', 'list', Steps),
  Step: defineType<StepComponent>('Step', 'item', Step),
  TableOfContents: defineType<TableOfContentsComponent>('TableOfContents', 'section', TableOfContents),
  TabGroup: defineType<TabGroupComponent>('TabGroup', 'section', TabGroup),
  Tab: defineType<TabComponent>('Tab', 'item', Tab),
  TabPanel: defineType<TabPanelComponent>('TabPanel', 'item', TabPanel),
  Footer: defineType<FooterComponent>('Footer', 'section', Footer),
  MusicPlaylist: defineType<MusicPlaylistComponent>('MusicPlaylist', 'section', MusicPlaylist),
  MusicRecording: defineType<MusicRecordingComponent>('MusicRecording', 'item', MusicRecording),
  CallToAction: defineType<CallToActionComponent>('CallToAction', 'section', CallToAction),
  Action: defineType<ActionComponent>('Action', 'item', Action),
  Feature: defineType<FeatureComponent>('Feature', 'section', Feature),
  Editor: defineType<EditorComponent>('Editor', 'section', Editor),
  Pricing: defineType<PricingComponent>('Pricing', 'section', Pricing),
  Tier: defineType<TierComponent>('Tier', 'tile', Tier),
  FeaturedTier: defineType<TierComponent>('FeaturedTier', 'tile', Tier),

  // Nodes
  //document,
  //value,
  //section,
  //grid,
  //tile,
  //heading,
  //paragraph,
  //hr,
  //image,
  //fence,
  //html,
  //blockquote,
  //list,
  //item,
  //strong,
  //link,
  //code,

  //h1: heading.attr({ level: 1 }),
  //h2: heading.attr({ level: 2 }),
  //h3: heading.attr({ level: 3 }),
  //h4: heading.attr({ level: 4 }),
  //h5: heading.attr({ level: 5 }),
  //h6: heading.attr({ level: 6 }),

  //// Types
  //Page: document.typeof('bw:Page'),
  ////DocPage: document.typeof('bw:DocPage'),
  //CallToAction: new Selector(['section', 'grid']).typeof('bw:CallToAction'),
  //Feature: new Selector(['section', 'grid']).typeof('bw:Feature'),
  //Hint: defineType<{
    //tag: 'section',
    //properties: {export interface ComponentType<TNode extends NodeType = NodeType, TProperties extends NodeMap = NodeMap, TSlots extends NodeMap = NodeMap> {
      //tag: TNode;
    
      //properties: TProperties;
    
      //slots: TSlots;
    //}
      //hintType: 'value',
    //},
    //slots: {
      //body: 'section',
    //}
  //}, Hint>('section', Hint),
  //Menu: defineType<{ tag: 'section', properties: {}, slots: {} }, Menu>('section', Menu),
  //SequentialPagination: defineType<{
    //tag: 'section',
    //properties: {
      //nextPage: 'link',
      //previousPage: 'link',
    //},
    //slots: {}
  //}, SequentialPagination>('section', SequentialPagination),
  //HintNote: section.typeof('bw:HintNote'),
  //HintCheck: section.typeof('bw:HintCheck'),
  //HintWarning: section.typeof('bw:HintWarning'),
  //HintCaution: section.typeof('bw:HintCaution'),
  ////Steps: list.typeof('bw:Steps'),
  //Steps: defineType<{
    //tag: 'list',
    //properties: {
      //step: 'item',
    //},
    //slots: {}
  //}, Steps>('list', Steps),
  //Step: defineType<{
    //tag: 'item',
    //properties: {
      //name: 'heading',
    //},
    //slots: {}
  //}, Step>('item', Step),
  //Editor: section.typeof('bw:Editor'),
  //TableOfContents: defineType<{
    //tag: 'section',
    //properties: {},
    //slots: {}
  //}, TableOfContents>('section', TableOfContents),
  //PageBody: section.typeof('bw:PageBody'),
  //PageContentSection: section.typeof('bw:PageContentSection'),
  //Pricing: section.typeof('bw:Pricing'),
  //Tier: tile.typeof('bw:Tier'),
  //FeaturedTier: tile.typeof('bw:FeaturedTier'),
  //MusicPlaylist: section.typeof('MusicPlaylist'),
  ////TabGroup: section.typeof('bw:TabGroup'),
  //TabGroup: defineType<{ tag: 'section', properties: { tab: 'item', panel: 'item' }, slots: { tabs: 'list', panels: 'list' }}, TabGroup>('section', TabGroup),
  //TabPanels: list.typeof('bw:TabPanels'),
  //TabPanel: defineType<{ tag: 'item', properties: {}, slots: {}}, TabPanel>('item', TabPanel),
  //TabList: list.typeof('bw:TabList'),
  ////Tab: item.typeof('bw:Tab'),
  //Tab: defineType<{ tag: 'item', properties: {}, slots: {}}, Tab>('item', Tab),

  //// Properties
  //tier: tile.property('bw:tier'),
  //tabs: list.property('bw:tabs'),
  //tab: item.property('bw:tab'),
  //panel: item.property('bw:panel'),
  //panels: list.property('bw:panels'),
  //step: item.property('bw:step'),
  //menu: section.property('bw:menu'),
  //body: section.property('bw:body'),
  //headings: section.property('bw:headings'),
  //summary: section.property('bw:summary'),
  //footer: section.property('bw:footer'),
  //pagination: section.property('bw:pagination'),
  //previousPage: link.property('bw:previousPage'),
  //nextPage: link.property('bw:nextPage'),
}
