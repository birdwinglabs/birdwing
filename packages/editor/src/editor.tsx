import React, { useState } from 'react';
import { AbstractDocument, SourceDocument } from '@aetlan/core';

import ContentEditor from './content';
import PagePreviewBar from './components/PagePreviewBar';
import SelectButton from './components/SelectButton';
import MetaPanel from './meta';

export interface EditorProps {
  source: SourceDocument;

  dependencies: AbstractDocument[];

  onChange: (source: SourceDocument) => void;

  onSave: (source: SourceDocument) => void;

  children: any
}

export default function Editor({ children, source, dependencies, onChange, onSave }: EditorProps) {
  const [content, setContent] = useState(source);
  const [panel, setPanel] = useState('content');
  const [size, setSize] = useState('desktop');
  const [panelSize, setPanelSize] = useState(600);

  function onChangeEvent(document: SourceDocument) {
    setContent(document);
    onChange(document);
  }

  function updateFrontmatter(key: string, value: any) {
    const frontmatter = content.frontmatter;
    frontmatter[key] = value;
    const c = { ...content, frontmatter };
    setContent(c);
    onChange(c);
  }

  React.useEffect(() => {
    switch(size) {
      case 'desktop':
        setPanelSize(600);
        break;
      case 'tablet':
        setPanelSize(800);
        break;
      case 'mobile':
        setPanelSize(1024);
        break;
    }
  }, [size])

  React.useEffect(() => {
    if (source) {
      setContent(source);
    }
  }, [source]);

  React.useEffect(() => {
    if (dependencies) {
      console.log(dependencies);
    }
  }, [dependencies])

  return (
    <div className="bg-stone-200 w-screen h-screen p-4 pt-20 fixed" style={{ paddingLeft: `${panelSize}px`}}>
      <div className="fixed h-20 top-0 pt-4 pr-4" style={{ width: `calc(100vw - ${panelSize}px)`, left: `${panelSize}px` }}>
        <PagePreviewBar size={size} onChangeSize={setSize} onSave={() => onSave(content)} />
      </div>
      <div className="fixed h-[calc(100vh-4rem)] left-0 top-0" style={{ width: `${panelSize}px` }}>
        <div className="w-full flex items-center gap-2 pb-4 px-6 pt-4 border-b text-sm">
          <button className="py-2 mr-2 text-stone-900">
            <span className="material-symbols-outlined">
              arrow_back
            </span> 
          </button>
          <SelectButton active={panel === 'content'} onClick={() => setPanel('content')}>
            Content
          </SelectButton>
          <SelectButton active={panel === 'meta'} onClick={() => setPanel('meta')}>
            Meta
          </SelectButton>
          <SelectButton active={panel === 'dependencies'} onClick={() => setPanel('dependencies')}>
            Dependencies
          </SelectButton>
        </div>
        { panel === 'dependencies' && dependencies &&
          <div className="py-4 px-8">
            <h1 className="text-sm text-stone-500 mt-4">Providers</h1>
            <ul>
              {dependencies.filter(d => d.type === 'fragment').map(d => {
                return <li className="text-lg my-2" key={d.id}>{d.path}</li>
              })}
            </ul>
            <h1 className="text-sm text-stone-500 mt-4">Partials</h1>
            <ul>
              {dependencies.filter(d => d.type === 'partial').map(d => {
                return <li className="text-lg my-2" key={d.id}>{d.path}</li>
              })}
            </ul>
          </div>
        }
        { panel === 'content' && content &&
          <ContentEditor document={content} onChange={onChangeEvent} />
        }

        { panel === 'meta' &&
          <MetaPanel data={content.frontmatter} onChange={updateFrontmatter} />
        }
      </div>
      <div className="relative w-full h-full shadow-xl overflow-y-auto">
        { children }
      </div>
    </div>
  );
}
