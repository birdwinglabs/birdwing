import { useState } from 'react';
import { HighlightContext } from './CodeBlock';
import { createContext } from 'react';

export interface PageContextValue {
  setState(id: string, value: any): void;

  state<T = any>(id: string, defaultValue: T): T;
}

export const PageContext = createContext<PageContextValue>({ setState: () => {}, state<T = any>(id: string, defaultValue: T) { return defaultValue; } });

export interface PageProps {
  children: any;

  highlight?: (content: string, language: string) => string;
}

export function Page({ children, highlight }: PageProps) {
  const [pageState, setPageState] = useState<Record<string, any>>({});

  function setState(id: string, state: any) {
    setPageState({ ...pageState, [id]: state});
  }

  function state<T = any>(id: string, defaultValue: T) {
    return id in pageState ? pageState[id] : defaultValue;
  }

  return (
    <PageContext.Provider value={{ state, setState }}>
      <HighlightContext.Provider value={highlight}>
        { children }
      </HighlightContext.Provider>
    </PageContext.Provider>
  );
}
