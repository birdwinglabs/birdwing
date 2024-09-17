import React, { useState } from 'react';
import { Tag } from '@markdoc/markdoc';
import { Renderer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";
import { AppConfig, Route, SourceDocument } from '@aetlan/core';
import { Aetlan, CompileContext } from '@aetlan/aetlan';
import * as MonacoEditor from '@monaco-editor/react';

export function Editor({ children, source, onChange }: any) {
  const [postContent, setPostContent] = useState(source ? source.body : '');

  function onChangeEvent(value: string) {
    setPostContent(value);
    onChange(value);
  }

  React.useEffect(() => {
    if (source) {
      setPostContent(source.body);
    }
  }, [source]);

  const options: any = {
    minimap: { enabled: false },
    lineNumbers: "off",
    fontSize: 10,
  }

  MonacoEditor.loader.init().then(monaco => {
    monaco.editor.defineTheme('aetlan', {
      base: 'vs', 
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#e7e5e4',
      },
    })
  });


  return (
    <div className="bg-stone-200 w-screen h-screen p-4 pl-[600px] fixed">
      <div className="fixed h-[calc(100vh-2rem)] w-[600px] left-0">
        { postContent &&
          <MonacoEditor.Editor
            theme="aetlan"
            height="100%"
            defaultLanguage="markdown"
            defaultValue={postContent}
            value={postContent}
            onChange={onChangeEvent}
            options={options}
          />
        }
      </div>
      <div className="relative w-full h-full shadow-xl overflow-y-auto">
        { children }
      </div>
    </div>
  );
}

export default function App({ components, themeConfig }: any): JSX.Element {
  const [content, setContent] = React.useState<Tag | null>(null);
  const [store, setStore] = React.useState<Store | null>(null);
  const [context, setContext] = React.useState<CompileContext | null>(null);
  const [source, setSource] = React.useState<SourceDocument | null>(null);
  const location = useLocation();

  const renderer = new Renderer(components);

  function onChange(value: string) {
    if (context && source) {
      console.log('push content');
      context.pushContent({...source, body: value});
    }
  }

  async function setRoute(route: Route, store: Store) {
    setContent(route.tag);
    window.document.title = route.title;
  }
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(async route => {
        if (route) {
          setRoute(route, store);
          const source = await store.getSourceByRoute(route);
          setSource(source);
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
            setRoute(route, s);
          }
        });
        ctx.transform();
        setContext(ctx);
      }

      const route = await s.getRoute(window.location.pathname);

      if (route) {
        setRoute(route, s);
        const source = await s.getSourceByRoute(route);
        setSource(source);
      }

      s.watch()
        .on('route-changed', route => {
          console.log(`route changed: ${route.url}`);
          if (route.url === currentUrl()) {
            setRoute(route, s);
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
    return (
      <Editor source={source} onChange={onChange}>
        { renderer.render(content) as JSX.Element }
      </Editor>
    )
  }

  return <h1>Loading...</h1>;
}
