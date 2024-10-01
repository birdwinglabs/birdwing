import { useState } from 'react';
import { HighlightContext } from './CodeBlock';
import { PageContext } from './PageContext';


export interface ProductionPageProps {
  children: any;

  highlight?: (content: string, language: string) => string;
}

export function ProductionPage({ children, highlight }: ProductionPageProps) {
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
