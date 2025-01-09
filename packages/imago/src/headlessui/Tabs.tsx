import { Imago } from "../Imago";
import { selectors as sel } from "../selectors.js";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export const tabs = Imago.configure()
  .render(sel.section.typeof('bw:TabGroup'), ({ id, className, children }) => {
    const { state, setState } = useContext(PageContext);

    return (
      <TabGroup className={className} selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
        { children }
      </TabGroup>
    )
  })
  .render(sel.list.property('bw:tabs'), TabList)
  .render(sel.list.property('bw:panels'), TabPanels)
  .render(sel.item.property('bw:tab'), Tab)
  .render(sel.item.property('bw:panel'), TabPanel)
