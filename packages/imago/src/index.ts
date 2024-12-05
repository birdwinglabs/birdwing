export * from './interfaces.js';

export { Tailwind } from './tailwind';
export { HeadlessUI } from './headlessui';

export { Imago, ImagoTemplate, Ordering, OrderingContext } from './Imago.js';
export { selectors } from './selectors.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}
