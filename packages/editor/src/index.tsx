import React from 'react';
import { Tag } from '@markdoc/markdoc';
import { Renderer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";
import { AbstractDocument, AppConfig, Route, SourceDocument } from '@aetlan/core';
import { Aetlan, CompileContext } from '@aetlan/aetlan';
import Editor from './editor';


export default function App({ components, themeConfig }: any): JSX.Element {
  const [content, setContent] = React.useState<Tag | null>(null);
  const [store, setStore] = React.useState<Store | null>(null);
  const [context, setContext] = React.useState<CompileContext | null>(null);
  const [source, setSource] = React.useState<SourceDocument | null>(null);
  const [deps, setDeps] = React.useState<AbstractDocument[]>([]);
  const location = useLocation();

  const renderer = new Renderer(components);

  function onSave(doc: SourceDocument) {
    if (store && source) {
      store.saveContent(doc);
    }
  }

  function onChange(doc: SourceDocument) {
    if (context && source) {
      context.pushContent(doc);
    }
  }

  async function setRoute(route: Route) {
    setContent(route.tag);
    window.document.title = route.title;
  }

  async function initEditor(route: Route, store: Store) {
    setRoute(route);
    const source = await store.getSourceByRoute(route);
    setSource(source);

    if (context && source) {
      const doc = context.cache.lookup(source._id);
      const d = context.cache.dependencies(doc);
      console.log(d);
      setDeps(d);
    }
  }
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(async route => {
        if (route) {
          initEditor(route, store);
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
        initEditor(route, s);
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

  if (content && source) {
    return (
      <Editor source={source} dependencies={deps} onChange={onChange} onSave={onSave}>
        { renderer.render(content) as JSX.Element }
      </Editor>
    )
  }

  return <h1>Loading...</h1>;
}
