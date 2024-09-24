import React from 'react';
import { Tag } from '@markdoc/markdoc';
import { Renderer, Page as PageContainer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";
import { Route } from '@aetlan/core';


export default function App({ components }: any): JSX.Element {
  const [content, setContent] = React.useState<Tag | null>(null);
  const [store, setStore] = React.useState<Store | null>(null);
  const location = useLocation();

  const renderer = new Renderer(components);

  function setRoute(route: Route) {
    setContent(route.tag);
    window.document.title = route.title;
  }
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(route => {
        if (route) {
          setRoute(route);
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
      console.log('connected to store');

      const route = await s.getRoute(window.location.pathname);

      if (route) {
        setRoute(route);
      }

      s.watch()
        .on('route-changed', route => {
          console.log(`route changed: ${route.url}`);
          if (route.url === currentUrl()) {
            setRoute(route);
          }
        })
        .on('target-changed', file => {
          if (file._id === '/main.css') {
            s.dispose();
            window.location.reload();
          }
        });
    });

    return () => {
      if (store) {
        store.dispose();
      }
    }
  }, []);

  if (content) {
    return <PageContainer>{ renderer.render(content) as JSX.Element }</PageContainer>;
  }

  return <h1>Loading...</h1>;
}
