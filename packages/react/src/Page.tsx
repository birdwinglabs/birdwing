import { Tag } from '@markdoc/markdoc';
import { useState } from 'react';
import { Renderer } from './renderer';
import { HighlightContext } from './CodeBlock';
import { PageContext } from './PageContext';

export interface PageProps {
  renderer: Renderer | undefined;

  content: Tag | any;

  highlight?: (content: string, language: string) => string;
}

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
        { renderer instanceof Renderer ? renderer.render(content) : content }
      </HighlightContext.Provider>
    </PageContext.Provider>
  );
}
