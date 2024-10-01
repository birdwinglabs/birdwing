import { createContext } from 'react';

export interface PageContextValue {
  setState(id: string, value: any): void;

  state<T = any>(id: string, defaultValue: T): T;
}

export const PageContext = createContext<PageContextValue>({ setState: () => {}, state<T = any>(id: string, defaultValue: T) { return defaultValue; } });
