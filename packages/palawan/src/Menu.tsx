import { Link as RouterLink } from 'react-router-dom';
import { Disclosure, DisclosureButton } from '@headlessui/react';
import { createComponent } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { navLink } from './Common';

export const Navbar = createComponent(schema.Menu, {
  tags: {
    h1: {
      render: ({ Slot }) => (
        <span className="font-bold text-lg dark:text-white">
          <RouterLink to="/"><Slot/></RouterLink>
        </span>
      ),
    },
    ul: {
      class: "flex space-x-8",
      parent: ({ children }) => (
        <div className="relative hidden lg:flex items-center ml-auto">
          <nav className="text-sm leading-6 font-semibold text-slate-700 dark:text-white">
            { children }
          </nav>
        </div>
      )
    },
  },
  render: ({ Slot }) => (
    <Disclosure as="nav" className="sticky top-0 z-40 w-full flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-900/10 dark:border-slate-50/[0.06] bg-white/95 dark:bg-primary-950 supports-backdrop-blur:bg-white/60">
      <div className="max-w-7xl mx-auto">
        <div className="py-4 border-b border-slate-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0">
          <div className="relative flex items-center">
            <DisclosureButton className="group mr-4">
              <span className="material-symbols-outlined block h-6 w-6 group-data-[open]:hidden dark:text-white">menu</span>
              <span className="material-symbols-outlined hidden h-6 w-6 group-data-[open]:block dark:text-white">close</span>
            </DisclosureButton>
            <Slot/>
          </div>
        </div>
      </div>
    </Disclosure>
  )
})
  .useComponent(schema.LinkItem, {
    tags: {
      a: navLink({
        class: "dark:hover:text-primary-400",
        classActive: "text-secondary-300 hover:text-primary-500 dark:text-secondary-300",
        classInactive: "text-stone-900 dark:text-white hover:text-primary-500",
      })
    }
  })
