import { CallToAction } from './CallToAction';
import { Feature } from './Feature';
import { Footer } from '../common/Footer';

import { PageSection } from './PageSection';
export { Feature } from './Feature';

import { createComponent, Tailwind } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { Layout } from "../Layout";
import { Container } from '../Common';
import { Navbar } from '../Menu';

export const Page = createComponent(schema.Page, {
  use: [Tailwind],
  parent: Layout,
})
  .useComponent(Navbar)
  .useComponent(PageSection)
  .useComponent(CallToAction)
  .useComponent(Feature)
  .useComponent(Footer({ Container }))
