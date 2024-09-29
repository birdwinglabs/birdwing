import React, { useState } from 'react';
import { AbstractDocument, SourceDocument } from '@birdwing/core';
import { Store } from '@birdwing/store';
import { CompileContext } from '@birdwing/compiler';

import ContentEditor from './content';
import PagePreviewBar from './components/PagePreviewBar';
import SelectButton from './components/SelectButton';
import MetaPanel from './meta';
import MenuLink from './components/MenuLink';

export interface EditorProps {
  children: any

  pageId: string;

  store: Store;

  compileContext: CompileContext;
}

export default function Editor({ children, pageId, store, compileContext }: EditorProps) {
  const [content, setContent] = useState<SourceDocument>();
  const [documents, setDocuments] = useState<AbstractDocument[]>();
  const [panel, setPanel] = useState('documents');
  const [size, setSize] = useState('desktop');
  const [panelSize, setPanelSize] = useState(600);

  React.useEffect(() => {
    const page = compileContext.cache.lookup(pageId);
    const deps = compileContext.cache.dependencies(page);
    setDocuments([page, ...deps]);
    setPanel('documents');
  }, [pageId]);

  async function editSource(doc: AbstractDocument) {
    const source = await store.getSource(doc.id);

    if (source) {
      setContent(source);
      setPanel('content');
    }
  }


  function onChangeEvent(value: string | undefined) {
    if (content && value) {
      const updatedDoc = { ...content, body: value };
      setContent(updatedDoc);

      if (compileContext) {
        compileContext.pushContent(updatedDoc);
      }
    }
  }

  function updateFrontmatter(key: string, value: any) {
    if (content) {
      const frontmatter = content.frontmatter;
      frontmatter[key] = value;
      const c = { ...content, frontmatter };
      setContent(c);
    }
  }

  function onSave() {
    if (store && content) {
      store.saveContent(content);
    }
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

  return (
    <div className="bg-stone-200 w-screen h-screen p-4 pt-20 fixed" style={{ paddingLeft: `${panelSize}px`}}>
      <div className="fixed h-20 top-0 pt-4 pr-4" style={{ width: `calc(100vw - ${panelSize}px)`, left: `${panelSize}px` }}>
        <PagePreviewBar size={size} onChangeSize={setSize} onSave={() => onSave()} />
      </div>
      <div className="fixed h-[calc(100vh-4rem)] left-0 top-0" style={{ width: `${panelSize}px` }}>
        { (panel === 'content' || panel === 'meta') && content &&
          <>
            <div className="w-full flex items-center gap-2 pb-4 px-6 pt-4 border-b text-sm">
              <button className="py-2 mr-2 text-stone-900" onClick={() => setPanel('documents')}>
                <span className="material-symbols-outlined">
                  arrow_back
                </span> 
              </button>
              <span>{ content._id }</span>
              <div className="flex items-center gap-2 ml-auto">
                <SelectButton active={panel === 'content'} onClick={() => setPanel('content')}>
                  Content
                </SelectButton>
                <SelectButton active={panel === 'meta'} onClick={() => setPanel('meta')}>
                  Meta
                </SelectButton>
              </div>
            </div>

            { panel === 'content' &&
              <ContentEditor value={content.body} onChange={onChangeEvent} />
            }
            { panel === 'meta' &&
              <MetaPanel data={content.frontmatter} onChange={updateFrontmatter} />
            }
          </>
        }
        { panel === 'documents' && documents &&
          <div className="py-4 px-8">
            <h1 className="text-sm text-stone-500">Page</h1>
            <ul>
              {documents.filter(d => d.type === 'page').map(d => {
                return <MenuLink key={d.id} onClick={() => editSource(d)}>{ d.path }</MenuLink>
              })}
            </ul>
            <h1 className="text-sm text-stone-500 mt-8">Providers</h1>
            <ul>
              {documents.filter(d => d.type === 'fragment').map(d => {
                return <MenuLink key={d.id} onClick={() => editSource(d)}>{ d.path }</MenuLink>
              })}
            </ul>
            <h1 className="text-sm text-stone-500 mt-8">Partials</h1>
            <ul>
              {documents.filter(d => d.type === 'partial').map(d => {
                return <MenuLink key={d.id} onClick={() => editSource(d)}>{ d.path }</MenuLink>
              })}
            </ul>
          </div>
        }
      </div>
      <div className="relative w-full h-full shadow-xl overflow-y-auto">
        { children }
      </div>
    </div>
  );
}
