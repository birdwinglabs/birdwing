import TextInput from "./components/TextInput";

export interface MetaPanelProps {
  data: Record<string, any>;

  onChange: (key: string, value: any) => void;
}

export default function MetaPanel({ data, onChange }: MetaPanelProps) {
  return (
    <div className="px-8">
      <TextInput
        label="Title"
        value={data.title}
        onChange={value => onChange('title', value)}
      />
      <TextInput
        label="Description"
        value={data.description}
        onChange={value => onChange('description', value)}
      />

      <label htmlFor="slug" className="text-xs text-stone-500 mt-2 block">Slug</label>
      <input
        name="slug"
        type="text"
        value={data.slug}
        spellCheck={false}
        className="bg-stone-200 p-4 border-b border-stone-300 w-full outline-none"
      />
    </div>
  );
}