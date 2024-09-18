import React, { useState } from 'react';
import { SourceDocument } from '@aetlan/core';

import ContentEditor from './content';
import PagePreviewBar from './components/PagePreviewBar';
import SelectButton from './components/SelectButton';
import MetaPanel from './meta';

export default function Editor({ children, source, onChange, onSave }: any) {
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
        </div>
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
