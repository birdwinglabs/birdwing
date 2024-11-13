import { createContext } from 'react';

export const HighlightContext = createContext<any>(undefined);

export function CodeBlock({ content, language, className }: any) {
  return (
    <HighlightContext.Consumer>
      { highlight => <code className={className} dangerouslySetInnerHTML={{ __html: highlight(content, language) }}></code> }
    </HighlightContext.Consumer>
  );
}
