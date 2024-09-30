import { createContext } from 'react';

export const HighlightContext = createContext<any>(undefined);

export function CodeBlock({ content, language }: any) {
  return (
    <HighlightContext.Consumer>
      { highlight => <code dangerouslySetInnerHTML={{ __html: highlight(content, language) }}></code> }
    </HighlightContext.Consumer>
  );
}
