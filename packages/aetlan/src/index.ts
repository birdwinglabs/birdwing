import { Plugin, PluginContext } from './plugin.js';
import { Document, Paragraph, Heading, List, Link, Fence } from './nodes.js';

export * from './interfaces.js';
export * from './nodes.js';

export { Aetlan } from './aetlan.js';
export { Renderer } from './renderer.js';
export { Transformer } from './transformer.js';
export { Compiler, ContentTarget } from './compiler.js';
export { Page } from './page.js';
export { Fragment } from './fragment.js';
export { CustomTag } from './tag.js';
export { ContentLoader } from './loader.js';
export { resolvePageUrl, extractHeadings } from './util.js';

export { Plugin, PluginContext };

export const nodes = {
  document: new Document(),
  heading: new Heading(),
  paragraph: new Paragraph(),
  list: new List(),
  link: new Link(),
  fence: new Fence(),
};
