import { heading, paragraph, fence, list, item, em, strong, link } from './nodes.js';

import { cta } from './tags/cta.js';
import { feature } from './tags/feature.js';

import { page } from './documents/page.js';
import { menu } from './documents/menu.js';
import { docpage } from './documents/docpage.js';
import { docsummary } from './documents/docsummary.js';
import { hint } from './tags/hint.js';
import { footer } from './documents/footer.js';

export const documents = {
  page,
  menu,
  footer,
  docpage,
  docsummary,
}

export const tags = {
  cta,
  feature,
  hint,
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

