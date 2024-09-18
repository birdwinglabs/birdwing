import React, { useState } from 'react';
import { SourceDocument } from '@aetlan/core';

import ContentEditor from './content';
import TextInput from './components/TextInput';

export default function Editor({ children, source, onChange, onSave }: any) {
  const [content, setContent] = useState(source);
  const [panel, setPanel] = useState('content');

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
    if (source) {
      setContent(source);
    }
  }, [source]);

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
          <ContentEditor document={content} onChange={onChangeEvent} />
        }

        { panel === 'meta' &&
          <div className="px-8">
            <TextInput
              label="Title"
              value={content.frontmatter.title}
              onChange={value => updateFrontmatter('title', value)}
            />
            <TextInput
              label="Description"
              value={content.frontmatter.description}
              onChange={value => updateFrontmatter('description', value)}
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
