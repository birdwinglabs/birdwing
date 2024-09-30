import { Tag } from '@markdoc/markdoc';
import { createContext, useState } from 'react';
import { Renderer } from './renderer';
import { HighlightContext } from './CodeBlock';

export interface PageContextValue {
  setState(id: string, value: any): void;

  state<T = any>(id: string, defaultValue: T): T;
}

export interface PageProps {
  renderer: Renderer;

  content: Tag;

  highlight?: (content: string, language: string) => string;
}

export const PageContext = createContext<PageContextValue>({ setState: () => {}, state<T = any>(id: string, defaultValue: T) { return defaultValue; } });

export function Page({ renderer, content, highlight }: PageProps) {
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
        { renderer.render(content) }
      </HighlightContext.Provider>
    </PageContext.Provider>
  );
}
