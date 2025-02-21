import { ComponentType } from "../interfaces.js";
import { PageSectionProperties } from "./page.js";

export class Tier {
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  price: string | undefined = undefined;
}

export interface TierComponent extends ComponentType<Tier> {
  tag: 'li',
  properties: {
    name: 'h1',
    description: 'p',
    price: 'p',
  },
  refs: {}
}

export class Pricing {
  name: string | undefined = undefined;
  headline: string | undefined = undefined;
  description: string | undefined = undefined;
  tier: Tier[] = [];
}

export interface PricingProperties extends PageSectionProperties {
  tier: 'li',
}

export interface PricingComponent extends ComponentType<Pricing> {
  tag: 'section',
  properties: PricingProperties,
  refs: {}
}
