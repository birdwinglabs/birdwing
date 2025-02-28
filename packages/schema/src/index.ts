import { heading, paragraph, fence, list, item, em, strong, text, link, hardbreak, image, proxy } from './nodes.js';

export { Page } from './documents/page.js';
import { menu } from './documents/menu.js';
import { doc } from './documents/doc.js';
import { summary } from './documents/summary.js';
import { footer } from './documents/footer.js';

import { cta } from './tags/cta.js';
import { grid } from './tags/grid.js';
import { editor } from './tags/editor.js';
import { feature, definition } from './tags/feature.js';
import { hint } from './tags/hint.js';
import { steps, step } from './tags/steps.js';
import { tab, tabs } from './tags/tabs.js';
import { pricing, tier } from './tags/pricing.js';
import { musicPlaylist } from './tags/music-playlist.js'
import { musicRecording } from './tags/music-playlist.js'

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
  proxy,
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
}
