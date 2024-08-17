import { FileHandler, Plugin } from './interfaces.js';

export * from './interfaces.js';
export * from './nodes.js';

export { Aetlan } from './aetlan.js';
export { ContentFactory } from './contentFactory.js';
export { Renderer } from './renderer.js';
export { Transformer, RenderablePage } from './transformer.js';

export function createFileHandlers(plugins: Plugin[]) {
  const handlers: FileHandler[] = [];
  for (const plugin of plugins) {
    handlers.push(...plugin.handlers);
  }
  return handlers;
}
