import { ComponentType } from "../interfaces";
import { TabGroup } from "./tabs";

export class Feature {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  tabs: TabGroup | undefined = undefined;
}

export interface FeatureComponent extends ComponentType<Feature> {
  tag: 'section',
  properties: {
    name: 'h1',
    headline: 'h2',
    description: 'p',
    tabs: 'section',
  },
  slots: {
    body: 'section',
    showcase: 'section',
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
