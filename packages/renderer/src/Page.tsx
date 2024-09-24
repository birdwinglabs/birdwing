import { createContext, useState } from 'react';

export const PageContext = createContext<any>([{}, ()=>{}]);

export function Page({ children }: any) {
  const [pageState, setPageState] = useState<Record<string, any>>({});

  function setState(id: string, state: any) {
    setPageState({ ...pageState, [id]: state});
  }

  return (
    <PageContext.Provider value={{ state: pageState, setState }}>
      { children }
    </PageContext.Provider>
  );
}
