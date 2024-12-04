import { Imago } from "../Imago";
import { selectors as sel } from "../selectors.js";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export const tabs = Imago.configure('tabs')
  .render(sel.tabGroup, ({ id, children }) => {
    const { state, setState } = useContext(PageContext);

    return (
      <TabGroup selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
        { children }
      </TabGroup>
    )
  })
  .element(sel.tabs, TabList)
  .element(sel.tabPanels, TabPanels)
  .element(sel.tab, Tab)
  .element(sel.tabPanel, TabPanel)
