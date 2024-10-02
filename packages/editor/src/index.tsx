import React from 'react';
import { Content, Page as PageContainer } from '@birdwing/react';
import { Store } from '@birdwing/store';
import { useLocation } from "react-router-dom";
import { AppConfig, Route } from '@birdwing/core';
import { Compiler, CompileContext } from '@birdwing/compiler';
import Editor from './editor';


export default function App({ components, themeConfig, highlight }: any): JSX.Element {
  const [store, setStore] = React.useState<Store | null>(null);
  const [route, setRoute] = React.useState<Route | null>(null);
  const [context, setContext] = React.useState<CompileContext | null>(null);
  const location = useLocation();

  async function initEditor(route: Route) {
    setRoute(route);
  }
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(async route => {
        if (route) {
          initEditor(route);
        }
      });
    }
  }, [location]);

  function currentUrl() {
    let path = window.location.pathname;
    if (path !== '/' && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  }

  React.useEffect(() => {
    Store.connect('http://localhost:3000').then(async s => {
      setStore(s);

      const appConfigData = await s.getOutput('/config.json');
      if (appConfigData) {
        const appConfig = JSON.parse(appConfigData) as AppConfig;
        const compiler = await Compiler.configure(s, themeConfig, appConfig);

        const ctx = compiler.watch();

        ctx.on('route-compiled', route => {
          if (route.url === currentUrl()) {
            setRoute(route);
          }
        });
        ctx.transform();
        setContext(ctx);
      }

      const route = await s.getRoute(window.location.pathname);

      if (route) {
        initEditor(route);
      }
    });

    return () => {
      if (store) {
        store.dispose();
      }
    }
  }, []);

  if (route && store && context) {
    return (
      <Editor pageId={route.source} store={store} compileContext={context}>
        <PageContainer highlight={highlight}>
          <Content components={components} tag={route.tag} />
        </PageContainer>
      </Editor>
    )
  }

  return <h1>Loading...</h1>;
}
