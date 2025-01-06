export * from './interfaces.js';

export { Tailwind } from './tailwind';
export { HeadlessUI } from './headlessui';

export { Imago, ImagoTheme, ImagoComponent, Ordering, OrderingContext } from './Imago.js';
export { selectors } from './selectors.js';
export { sectionSlot } from './Imago.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}
