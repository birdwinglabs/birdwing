import { PageContext } from '@birdwing/react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export default {
  Tab: ({ Slot, className }: any) => <Tab className={className}><Slot/></Tab>,
  TabList: ({ Slot, className }: any) => <TabList className={className}><Slot/></TabList>,
  TabPanels: ({ Slot, className }: any) => <TabPanels className={className}><Slot/></TabPanels>,
  TabPanel: ({ Slot, className }: any) => <TabPanel className={className}><Slot/></TabPanel>,
  TabGroup: ({ id, className, Slot}: any) => {
    return (
      <PageContext.Consumer>
        {({ state, setState }) => (
          <TabGroup className={className} selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
            <Slot/>
          </TabGroup>
        )}
      </PageContext.Consumer>
    )
  }
};
