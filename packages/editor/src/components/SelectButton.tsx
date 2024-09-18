export interface SelectButtonProps {
  active: boolean;

  onClick: () => void;

  children: any;
}


export default function SelectButton({ children, active, onClick }: SelectButtonProps) {
  const classActive = 'px-4 py-2 text-stone-900 font-semibold';
  const classInactive = 'px-4 py-2 text-stone-400';

  return (
    <button onClick={onClick} className={ active ? classActive : classInactive}>
      { children }
    </button>
  );
}
