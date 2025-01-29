import { ComponentType, Newable } from '../interfaces.js';
import { MusicPlaylist, MusicPlaylistComponent, MusicRecording, MusicRecordingComponent } from './audio.js';
import { Action, ActionComponent, CallToAction, CallToActionComponent } from './cta.js';
import { DocPage, DocPageComponent, Headings, HeadingsComponent, TableOfContents, TableOfContentsComponent } from './docpage.js';
import { Editor, EditorComponent } from './editor.js';
import { Feature, FeatureComponent, FeatureTabs, FeatureTabsComponent } from './feature.js';
import { Footer, FooterComponent } from './footer.js';
import { Grid, GridComponent } from './grid.js';
import { Hint, HintComponent } from './hint.js';
import { Menu, MenuComponent } from './menu.js';
import { Page, PageComponent } from './page.js';
import { SequentialPagination, SequentialPaginationComponent } from './pagination.js';
import { Pricing, PricingComponent, Tier, TierComponent } from './pricing.js';
import { Step, StepComponent, Steps, StepsComponent } from './steps.js';
import { Tab, TabComponent, TabGroup, TabGroupComponent, TabPanel, TabPanelComponent } from './tabs.js';

export { DocPage };

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

export function defineType<T extends ComponentType<any>>(name: string, tag: T["tag"], schemaCtr: Newable<T["schema"]>) {
  return new Type<T>(name, tag, schemaCtr);
}

export const schema = {
  Page: defineType<PageComponent>('Page', 'document', Page),
  DocPage: defineType<DocPageComponent>('DocPage', 'document', DocPage),
  Headings: defineType<HeadingsComponent>('Headings', 'aside', Headings),
  Hint: defineType<HintComponent>('Hint', 'section', Hint),
  Menu: defineType<MenuComponent>('Menu', 'nav', Menu),
  SequentialPagination: defineType<SequentialPaginationComponent>('SequentialPagination', 'nav', SequentialPagination),
  Steps: defineType<StepsComponent>('Steps', 'ol', Steps),
  Step: defineType<StepComponent>('Step', 'li', Step),
  TableOfContents: defineType<TableOfContentsComponent>('TableOfContents', 'nav', TableOfContents),
  TabGroup: defineType<TabGroupComponent>('TabGroup', 'section', TabGroup),
  Tab: defineType<TabComponent>('Tab', 'li', Tab),
  TabPanel: defineType<TabPanelComponent>('TabPanel', 'li', TabPanel),
  Footer: defineType<FooterComponent>('Footer', 'footer', Footer),
  MusicPlaylist: defineType<MusicPlaylistComponent>('MusicPlaylist', 'section', MusicPlaylist),
  MusicRecording: defineType<MusicRecordingComponent>('MusicRecording', 'li', MusicRecording),
  CallToAction: defineType<CallToActionComponent>('CallToAction', 'section', CallToAction),
  Action: defineType<ActionComponent>('Action', 'li', Action),
  Feature: defineType<FeatureComponent>('Feature', 'section', Feature),
  FeatureTabs: defineType<FeatureTabsComponent>('FeatureTabs', 'section', FeatureTabs),
  Editor: defineType<EditorComponent>('Editor', 'section', Editor),
  Pricing: defineType<PricingComponent>('Pricing', 'section', Pricing),
  Tier: defineType<TierComponent>('Tier', 'li', Tier),
  FeaturedTier: defineType<TierComponent>('FeaturedTier', 'li', Tier),
  Grid: defineType<GridComponent>('Grid', 'section', Grid),
}
