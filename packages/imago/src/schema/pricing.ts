import { ComponentType } from "../interfaces";

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

export interface PricingComponent extends ComponentType<Pricing> {
  tag: 'section',
  properties: {
    name: 'h1',
    headline: 'h2',
    description: 'p',
    tier: 'li',
  },
  refs: {}
}
