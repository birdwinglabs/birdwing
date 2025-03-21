import { createComponent, Tailwind } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";

import { CallToAction } from './CallToAction';
import { Feature } from './Feature';
import { PageSection } from './PageSection';
import { Layout } from "../Layout";
import { Container } from '../Common';
import { Navbar } from '../Menu';

import { TabGroup } from '../common/TabGroup';
import { Footer } from '../common/Footer';

export const MarketingPage = createComponent(schema.Page, {
  use: [Tailwind],
  parent: Layout,
})
  .useComponent(Navbar)
  .useComponent(PageSection)
  .useComponent(CallToAction)
  .useComponent(Feature)
  .useComponent(TabGroup({ Base: PageSection, Container }))
  .useComponent(Footer({ Container }))
