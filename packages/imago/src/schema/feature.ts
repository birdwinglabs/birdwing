import { ComponentType } from "../interfaces";
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

export class Feature {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  featureItem: FeatureDefinition[] = [];
}

export interface FeatureComponent extends ComponentType<Feature> {
  tag: 'section',
  properties: {
    name: 'h1',
    headline: 'h2',
    description: 'p',
    featureItem: 'div',
  },
  refs: {
    layout: 'div',
    body: 'div',
    showcase: 'div',
  },
}

export class FeatureTabs {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  tabs: TabGroup = new TabGroup();
}

export interface FeatureTabsComponent extends ComponentType<FeatureTabs> {
  tag: 'section',
  properties: {
    name: 'h1',
    headline: 'h2',
    description: 'p',
    tabs: 'section',
  },
}
