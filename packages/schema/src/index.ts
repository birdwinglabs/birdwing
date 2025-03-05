import { heading, paragraph, fence, list, item, em, strong, text, link, hardbreak, image } from './nodes.js';

export { Page } from './documents/page.js';
import { menu } from './documents/menu.js';
import { doc } from './documents/doc.js';
import { summary } from './documents/summary.js';
import { footer } from './documents/footer.js';

import { cta } from './tags/cta.js';
import { error } from './tags/error.js';
import { grid } from './tags/grid.js';
import { editor } from './tags/editor.js';
import { feature, definition } from './tags/feature.js';
import { hint } from './tags/hint.js';
import { steps, step } from './tags/steps.js';
import { tab, tabs } from './tags/tabs.js';
import { pricing, tier } from './tags/pricing.js';
import { musicPlaylist } from './tags/music-playlist.js'
import { musicRecording } from './tags/music-recording.js'
import Markdoc from '@markdoc/markdoc';

export * from './interfaces.js';

export const documents = {
  //page,
  menu,
  footer,
  doc,
  summary,
}

export const tags = {
  cta,
  'call-to-action': cta,
  editor,
  error,
  feature,
  definition,
  grid,
  hint,
  tab,
  tabs,
  step,
  steps,
  pricing,
  tier,
  'music-playlist': musicPlaylist,
  'music-recording': musicRecording,
  ...Markdoc.tags
}

export const nodes = {
  heading,
  paragraph,
  fence,
  list,
  item,
  em,
  strong,
  text,
  link,
  hardbreak,
  image,
  table: Markdoc.nodes.table,
  thead: Markdoc.nodes.thead,
  tbody: Markdoc.nodes.tbody,
  th: Markdoc.nodes.th,
  tr: Markdoc.nodes.tr,
  error: Markdoc.nodes.error,
}
