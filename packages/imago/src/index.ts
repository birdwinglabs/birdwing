export * from './interfaces.js';

export { Tailwind } from './tailwind';
//export { schema } from '@birdwing/schema';
export { createComponent } from './Component.js';
export { createTheme } from './theme.js';

export interface NavLinkConfig {
  end: boolean;
  active: string;
  inactive: string;
}

import HeadlessUITabs from './headlessui/Tabs.js';

export { HeadlessUITabs };
