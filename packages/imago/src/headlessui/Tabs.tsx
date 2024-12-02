import { Imago } from "../Imago";
import { PageContext } from '@birdwing/react';
import { useContext } from 'react';
import { Tab, TabGroup, TabList, TabPanels, TabPanel } from '@headlessui/react';

export const tabs = Imago.configure('tabs')
  .replace('section', {
    match: { name: 'tab-group' },
    render: ({ id, children }) => {
      const { state, setState } = useContext(PageContext);

      return (
        <TabGroup selectedIndex={state(id || '', 0)} onChange={index => setState(id || '', index)}>
          { children }
        </TabGroup>
      )
    }
  })
  .changeElement('list', {
    matchClass: 'tabs',
    replace: TabList,
  })
  .changeElement('list', {
    matchClass: 'tab-panels',
    replace: TabPanels,
  })
  .changeElement('item', {
    matchClass: 'tab',
    replace: Tab,
  })
  .changeElement('item', {
    matchClass: 'tab-panel',
    replace: TabPanel,
  });
