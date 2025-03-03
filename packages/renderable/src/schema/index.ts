import { ComponentType } from "../interfaces";
import { MusicPlaylist, MusicPlaylistComponent, MusicRecording, MusicRecordingComponent } from './audio.js';
import { CallToAction, CallToActionComponent, LinkItem, LinkItemComponent } from './cta.js';
import { DocPage, DocPageComponent, Headings, HeadingsComponent, TableOfContents, TableOfContentsComponent } from './docpage.js';
import { Editor, EditorComponent } from './editor.js';
import { Error, ErrorComponent } from "./error";
import { Feature, FeatureComponent, FeatureDefinition, FeatureDefinitionComponent } from './feature.js';
import { Footer, FooterComponent } from './footer.js';
import { Grid, GridComponent } from './grid.js';
import { Hint, HintComponent } from './hint.js';
import { Menu, MenuComponent } from './menu.js';
import { Page, PageComponent, PageSection, PageSectionComponent } from './page.js';
import { SequentialPagination, SequentialPaginationComponent } from './pagination.js';
import { Pricing, PricingComponent, Tier, TierComponent } from './pricing.js';
import { Step, StepComponent, Steps, StepsComponent } from './steps.js';
import { Tab, TabComponent, TabGroup, TabGroupComponent, TabPanel, TabPanelComponent } from './tabs.js';

export interface Newable<T> {
  new (...args: any[]): T;
}

export class Type<T extends ComponentType<object>> {
  constructor(
    public readonly name: string,
    private schemaCtr: Newable<T["schema"]>,
  ) {}

  create() {
    return new this.schemaCtr();
  }
}

export class TypeFactory<TSchema extends object> {
  constructor(private schema: Newable<TSchema>) {}

  defineType<T extends ComponentType<TSchema>>(name: string) {
    return new Type<T>(name, this.schema);
  }
}

export function useSchema<T extends object>(schema: Newable<T>) {
  return new TypeFactory(schema);
}


export const schema = {
  Page: useSchema(Page).defineType<PageComponent>('Page'),
  PageSection: useSchema(PageSection).defineType<PageSectionComponent>('PageSection'),
  DocPage: useSchema(DocPage).defineType<DocPageComponent>('DocPage'),
  Headings: useSchema(Headings).defineType<HeadingsComponent>('Headings'),
  Hint: useSchema(Hint).defineType<HintComponent>('Hint'),
  Menu: useSchema(Menu).defineType<MenuComponent>('Menu'),
  SequentialPagination: useSchema(SequentialPagination).defineType<SequentialPaginationComponent>('SequentialPagination'),
  Steps: useSchema(Steps).defineType<StepsComponent>('Steps'),
  Step: useSchema(Step).defineType<StepComponent>('Step'),
  TableOfContents: useSchema(TableOfContents).defineType<TableOfContentsComponent>('TableOfContents'),
  TabGroup: useSchema(TabGroup).defineType<TabGroupComponent>('TabGroup'),
  Tab: useSchema(Tab).defineType<TabComponent>('Tab'),
  TabPanel: useSchema(TabPanel).defineType<TabPanelComponent>('TabPanel'),
  Footer: useSchema(Footer).defineType<FooterComponent>('Footer'),
  MusicPlaylist: useSchema(MusicPlaylist).defineType<MusicPlaylistComponent>('schema:MusicPlaylist'),
  MusicRecording: useSchema(MusicRecording).defineType<MusicRecordingComponent>('schema:MusicRecording'),
  CallToAction: useSchema(CallToAction).defineType<CallToActionComponent>('CallToAction'),
  LinkItem: useSchema(LinkItem).defineType<LinkItemComponent>('LinkItem'),
  Feature: useSchema(Feature).defineType<FeatureComponent>('Feature'),
  FeatureDefinition: useSchema(FeatureDefinition).defineType<FeatureDefinitionComponent>('FeatureDefinition'),
  Editor: useSchema(Editor).defineType<EditorComponent>('Editor'),
  Pricing: useSchema(Pricing).defineType<PricingComponent>('Pricing'),
  Tier: useSchema(Tier).defineType<TierComponent>('Tier'),
  FeaturedTier: useSchema(Tier).defineType<TierComponent>('FeaturedTier'),
  Grid: useSchema(Grid).defineType<GridComponent>('Grid'),
  Error: useSchema(Error).defineType<ErrorComponent>('Error'),
}
