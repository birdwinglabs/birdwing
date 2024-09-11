import React from 'react';
import { Tag } from '@markdoc/markdoc';
import { Renderer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";


export default function App({ components }: any): JSX.Element {
  const [content, setContent] = React.useState<Tag | null>(null);
  const [store, setStore] = React.useState<Store | null>(null);
  const location = useLocation();

  const renderer = new Renderer(components);
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(route => {
        setContent(route ? route.tag : null);
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
        setContent(route.tag);
      }

      s.watch()
        .on('route-changed', route => {
          console.log(`route changed: ${route.url}`);
          if (route.url === currentUrl()) {
            setContent(route.tag);
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
    return renderer.render(content) as JSX.Element;
  }

  return <h1>Loading...</h1>;
}
