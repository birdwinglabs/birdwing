import { heading, paragraph, fence, list, item, em, strong, link } from './nodes.js';

import { cta } from './tags/cta.js';
import { feature } from './tags/feature.js';
import { tabs } from './tags/tabs.js';

import { page } from './documents/page.js';
import { menu } from './documents/menu.js';
import { docpage } from './documents/docpage.js';
import { summary } from './documents/summary.js';
import { hint } from './tags/hint.js';
import { footer } from './documents/footer.js';
import { pricing, tier } from './tags/pricing.js';

export const documents = {
  page,
  menu,
  footer,
  docpage,
  summary,
}

export const tags = {
  cta,
  'call-to-action': cta,
  feature,
  hint,
  pricing,
  tier,
  tabs,
}

export const nodes = {
  heading,
  paragraph,
  fence,
  list,
  item,
  em,
  strong,
  link,
}
