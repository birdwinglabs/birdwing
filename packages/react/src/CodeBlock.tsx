import { createContext } from 'react';

export const HighlightContext = createContext<any>(undefined);

export function CodeBlock({ language, className, children }: any) {
  return (
    <HighlightContext.Consumer>
      { highlight => children && <code className={className} dangerouslySetInnerHTML={{ __html: highlight(children, language) }}></code> }
    </HighlightContext.Consumer>
  );
}
