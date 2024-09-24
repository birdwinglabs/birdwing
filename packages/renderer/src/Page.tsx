import { Tag } from '@markdoc/markdoc';
import { createContext, useState } from 'react';
import { Renderer } from './renderer';

export interface PageContextValue {
  setState(id: string, value: any): void;

  state<T = any>(id: string, defaultValue: T): T;
}

export interface PageProps {
  renderer: Renderer;

  content: Tag;
}

export const PageContext = createContext<PageContextValue>({ setState: () => {}, state<T = any>(id: string, defaultValue: T) { return defaultValue; } });

export function Page({ renderer, content }: PageProps) {
  const [pageState, setPageState] = useState<Record<string, any>>({});

  function setState(id: string, state: any) {
    setPageState({ ...pageState, [id]: state});
  }

  function state<T = any>(id: string, defaultValue: T) {
    return id in pageState ? pageState[id] : defaultValue;
  }

  return (
    <PageContext.Provider value={{ state, setState }}>
      { renderer.render(content) }
    </PageContext.Provider>
  );
}
