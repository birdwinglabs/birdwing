export * from './interfaces.js';

export { Tailwind } from './tailwind';
export { Selector } from './selector.js';
export { schema } from './schema/index.js';
export { createComponent, select } from './Component.js';
export { createTheme } from './theme.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}

import HeadlessUITabs from './headlessui/Tabs.js';

export { HeadlessUITabs };
