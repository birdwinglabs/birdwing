import { ComponentType } from "../interfaces";
import { PageSection, PageSectionComponent } from "./page";
import { TabGroup } from "./tabs";

export class FeatureDefinition {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  image: string | undefined = undefined;
}

export interface FeatureDefinitionComponent extends ComponentType<FeatureDefinition> {
  tag: 'div',
  properties: {
    name: 'dt',
    description: 'dd',
    image: 'img' | 'svg',
  }
}

export class Feature extends PageSection {
  featureItem: FeatureDefinition[] = [];
}

export interface FeatureComponent extends ComponentType<Feature> {
  tag: 'section',
  properties: {
    name: 'p',
    headline: 'h1',
    description: 'p',
    featureItem: 'div',
  },
  refs: {
    layout: 'div',
    body: 'div',
    showcase: 'div',
  },
}

export class FeatureTabs extends PageSection {
  tabs: TabGroup = new TabGroup();
}

export interface FeatureTabsComponent extends ComponentType<FeatureTabs> {
  tag: 'section',
  properties: {
    name: 'p',
    headline: 'h1',
    description: 'p',
    tabs: 'section',
  },
}
