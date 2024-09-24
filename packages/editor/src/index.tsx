import React from 'react';
import { Page, Renderer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";
import { AppConfig, Route } from '@aetlan/core';
import { Aetlan, CompileContext } from '@aetlan/aetlan';
import Editor from './editor';


export default function App({ components, themeConfig }: any): JSX.Element {
  const [store, setStore] = React.useState<Store | null>(null);
  const [route, setRoute] = React.useState<Route | null>(null);
  const [context, setContext] = React.useState<CompileContext | null>(null);
  const location = useLocation();

  const renderer = new Renderer(components);

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
        const aetlan = new Aetlan(s, { ...appConfig, ...themeConfig});

        const ctx = await aetlan.watch();

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
        <Page renderer={renderer} content={route.tag} />
      </Editor>
    )
  }

  return <h1>Loading...</h1>;
}
