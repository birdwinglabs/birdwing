
export interface MenuLinkProps {
  children: any;

  onClick: () => void;
}

export default function MenuLink({ children, onClick }: MenuLinkProps) {
  return (
    <li>
      <button className="text-lg my-2 hover:border-stone-600 border-stone-200 border-b" onClick={() => onClick()}>
        { children }
      </button>
    </li>
  );
}
