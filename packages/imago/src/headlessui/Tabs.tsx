import { Imago } from "../Imago";
import { schema } from "../schema.js";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

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
