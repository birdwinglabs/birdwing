import SelectButton from "./SelectButton";

export interface PagePreviewBarProps {
  size: string;

  onSave: () => void;

  onChangeSize: (size: string) => void;
}

export default function PagePreviewBar({ size, onSave, onChangeSize }: PagePreviewBarProps) {
  return (
    <div className="w-full h-full flex items-center gap-2 p-4 text-sm bg-white border-b-8 border-stone-200 shadow-xl">
      <button onClick={() => onSave()} className="rounded px-4 py-2 bg-stone-800 text-white">
        Save
      </button>
      <div className="flex items-center ml-auto">
        <SelectButton active={size === 'desktop'} onClick={() => onChangeSize('desktop')}>
          Desktop
        </SelectButton>
        <SelectButton active={size === 'tablet'} onClick={() => onChangeSize('tablet')}>
          Tablet
        </SelectButton>
        <SelectButton active={size === 'mobile'} onClick={() => onChangeSize('mobile')}>
          Mobile
        </SelectButton>
      </div>
    </div>
  );
}