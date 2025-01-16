import { Imago } from "../Imago";
import { schema } from "../schema.js";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export default {
  Tab: ({ Slot, className }: any) => <Tab className={className}><Slot/></Tab>,
  TabList: ({ Slot, className }: any) => <TabList className={className}><Slot/></TabList>,
  TabPanels: ({ Slot, className }: any) => <TabPanels className={className}><Slot/></TabPanels>,
  TabPanel: ({ Slot, className }: any) => <TabPanel className={className}><Slot/></TabPanel>,
  TabGroup: ({ id, className, children}: any) => {
    const { state, setState } = useContext(PageContext);

    return (
      <TabGroup className={className} selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
        { children }
      </TabGroup>
    )
  }
};

export const tabs = Imago.configure()
  .render(schema.TabGroup, ({ id, className, children }) => {
    const { state, setState } = useContext(PageContext);

    return (
      <TabGroup className={className} selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
        { children }
      </TabGroup>
    )
  })
  .render(schema.TabList, TabList)
  .render(schema.Tab, Tab)
  .render(schema.TabPanels, TabPanels)
  .render(schema.TabPanel, TabPanel)
