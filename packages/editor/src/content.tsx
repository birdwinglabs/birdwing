import * as MonacoEditor from '@monaco-editor/react';

export interface ContentEditorProps {
  value: string;

  onChange: (value: string | undefined) => void;
}

export default function ContentEditor({ value, onChange }: ContentEditorProps) {
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


  return (
    <MonacoEditor.Editor
      theme="aetlan"
      height="100%"
      defaultLanguage="markdown"
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
