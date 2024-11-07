import { heading, paragraph, fence, list, item, em, strong, link, hardbreak, image } from './nodes.js';

import { page } from './documents/page.js';
import { menu } from './documents/menu.js';
import { docpage } from './documents/docpage.js';
import { summary } from './documents/summary.js';
import { footer } from './documents/footer.js';

import { cta } from './tags/cta.js';
import { feature } from './tags/feature.js';
import { hint } from './tags/hint.js';
import { steps } from './tags/steps.js';
import { tabs } from './tags/tabs.js';

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
  tabs,
  steps,
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
  hardbreak,
  image,
}
