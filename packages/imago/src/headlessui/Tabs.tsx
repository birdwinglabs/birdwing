import { Imago } from "../Imago";
import { selectors as sel } from "../selectors.js";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export const tabs = Imago.configure()
  .render(sel.tabGroup, ({ id, children }) => {
    const { state, setState } = useContext(PageContext);

    return (
      <TabGroup selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
        { children }
      </TabGroup>
    )
  })
  .render(sel.tabs, TabList)
  .render(sel.tabPanels, TabPanels)
  .render(sel.tab, Tab)
  .render(sel.tabPanel, TabPanel)
