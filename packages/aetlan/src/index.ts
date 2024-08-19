import { FileHandler } from './interfaces.js';
import { Plugin } from './plugin.js';
import { Document, Paragraph, Heading, List, Link, Fence } from './nodes.js';

export * from './interfaces.js';
export * from './nodes.js';

export { Aetlan } from './aetlan.js';
export { ContentFactory } from './contentFactory.js';
export { Renderer } from './renderer.js';
export { Transformer } from './transformer.js';
export { Page, RenderablePage } from './page.js';
export { Fragment } from './fragment.js';

export { Plugin };


export function createFileHandlers(plugins: Plugin[]) {
  const handlers: FileHandler[] = [];
  for (const plugin of plugins) {
    handlers.push(...plugin.handlers);
  }
  return handlers;
}

export const nodes = {
  document: new Document(),
  heading: new Heading(),
  paragraph: new Paragraph(),
  list: new List(),
  link: new Link(),
  fence: new Fence(),
};
