import React, { useState } from 'react';
import { Tag } from '@markdoc/markdoc';
import { Renderer } from '@aetlan/renderer';
import { Store } from '@aetlan/store';
import { useLocation } from "react-router-dom";
import { AppConfig, Route, SourceDocument } from '@aetlan/core';
import { Aetlan, CompileContext } from '@aetlan/aetlan';
import * as MonacoEditor from '@monaco-editor/react';

export function Editor({ children, source, onChange, onSave }: any) {
  const [content, setContent] = useState(source);
  const [panel, setPanel] = useState('content');

  function onChangeEvent(value: string) {
    const c = { ...content, body: value };
    setContent(c);
    onChange(c);
  }

  function onChangeTitle(value: string) {
    const frontmatter = content.frontmatter;
    frontmatter.title = value;
    const c = { ...content, frontmatter };
    setContent(c);
    onChange(c);
  }

  React.useEffect(() => {
    if (source) {
      setContent(source);
    }
  }, [source]);

  const options: any = {
    minimap: { enabled: false },
    lineNumbers: "off",
    fontSize: 10,
    wordWrap: "on",
    bracketPairColorization: { enabled: false },
  }

  MonacoEditor.loader.init().then(monaco => {
    monaco.editor.defineTheme('aetlan', {
      base: 'vs', 
      inherit: true,
      rules: [
        {
          token: "",
          foreground: "#2e2e2e"
        },
        {
          token: "string",
          foreground: "66634e"
        },
        {
          token: "number",
          foreground: "66634e"
        },
        {
          token: "attribute.value",
          foreground: "66634e"
        },
        {
          token: "comment",
          foreground: "8a8774"
        },
        {
          token: "keyword",
          foreground: "a24222"
        },
        {
          token: "key",
          foreground: "a24222"
        },
        {
          token: "value",
          foreground: "a24222"
        },
        {
          token: "type",
          foreground: "a24222"
        }
      ],
      colors: {
        'editor.background': '#e7e5e4',
      },
    })
  });

  const tabActive = 'px-4 py-2 text-stone-900 font-semibold';
  const tabInactive = 'px-4 py-2 text-stone-400';

  return (
    <div className="bg-stone-200 w-screen h-screen p-4 pl-[600px] fixed">
      <div className="fixed h-[calc(100vh-2rem)] w-[600px] left-0">
        <div className="w-full flex items-center gap-2 pb-4 px-6 border-b text-sm">
          <button className="py-2 mr-2 text-stone-900">
           <span className="material-symbols-outlined">
            arrow_back
          </span> 
          </button>
          <button onClick={() => setPanel('content')} className={ panel === 'content' ? tabActive : tabInactive}>
            Content
          </button>
          <button onClick={() => setPanel('meta')} className={ panel === 'meta' ? tabActive : tabInactive}>
            Meta
          </button>
          <div className="flex items-center ml-auto">
            <button onClick={() => onSave(content)} className="rounded px-4 py-2 bg-stone-800 text-white">
              Save
            </button>
          </div>
        </div>
        { panel === 'content' && content &&
          <MonacoEditor.Editor
            theme="aetlan"
            height="100%"
            defaultLanguage="markdown"
            defaultValue={content.body}
            value={content.body}
            onChange={onChangeEvent}
            options={options}
          />
        }

        { panel === 'meta' &&
          <div className="px-8">
            <label htmlFor="title" className="text-xs text-stone-500 mt-2 block">Title</label>
            <input 
              name="title"
              type="text"
              value={content.frontmatter.title}
              onChange={(e) => onChangeTitle(e.target.value)}
              spellCheck={false}
              className="bg-stone-200 p-4 border-b border-stone-300 w-full outline-none"
            />

            <label htmlFor="description" className="text-xs text-stone-500 mt-2 block">Description</label>
            <input
              name="description"
              type="text"
              value={content.frontmatter.description}
              spellCheck={false}
              className="bg-stone-200 p-4 border-b border-stone-300 w-full outline-none"
            />

            <label htmlFor="slug" className="text-xs text-stone-500 mt-2 block">Slug</label>
            <input
              name="slug"
              type="text"
              value={content.frontmatter.slug}
              spellCheck={false}
              className="bg-stone-200 p-4 border-b border-stone-300 w-full outline-none"
            />
          </div>
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
  
  React.useEffect(() => {
    if (store) {
      store.getRoute(location.pathname).then(async route => {
        if (route) {
          setRoute(route);
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
            setRoute(route);
          }
        });
        ctx.transform();
        setContext(ctx);
      }

      const route = await s.getRoute(window.location.pathname);

      if (route) {
        setRoute(route);
        const source = await s.getSourceByRoute(route);
        setSource(source);
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
    return (
      <Editor source={source} onChange={onChange} onSave={onSave}>
        { renderer.render(content) as JSX.Element }
      </Editor>
    )
  }

  return <h1>Loading...</h1>;
}
