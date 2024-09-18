
export interface TextInputProps {
  label: string;

  value: string;

  onChange: (value: string) => void;
}

export default function TextInput({ label, value, onChange }: TextInputProps) {
  return (
    <label className="text-xs text-stone-500 mt-2 block">
      { label }
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="text-lg text-stone-800 bg-stone-200 p-4 border-b border-stone-300 w-full outline-none"
      />
    </label>
  );
}
