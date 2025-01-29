export * from './interfaces.js';

export { Tailwind } from './tailwind';
export { HeadlessUI } from './headlessui';

export { Imago, Ordering, OrderingContext } from './Imago.js';
export { Selector } from './selector.js';
export { schema } from './schema/index.js';
export { slot, hasProperty } from './Imago.js';
export { createComponent, item } from './Component.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}

import HeadlessUITabs from './headlessui/Tabs.js';

export { HeadlessUITabs };
