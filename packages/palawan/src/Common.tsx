import { TagHandler, TagMap } from "@birdwing/imago";
import { NavLink } from "react-router-dom";

interface NavLinkOptions {
  class: string;
  classInactive: string;
  classActive: string;
}

export function navLink(options: NavLinkOptions): TagHandler<'a', any> {
  return {
    render: ({ href, Slot }) => {
      const className = ({ isActive }: any) => isActive
        ? `${options.class} ${options.classActive}`
        : `${options.class} ${options.classInactive}`;

      return (
        <NavLink to={href} end={true} className={className}><Slot/></NavLink>
      );
    }
  }
}

export const tags: Partial<TagMap> = {
  p: "my-4 font-light dark:text-white",
  h1: "text-3xl tracking-tight text-black dark:text-white sm:text-4xl",
  h3: "text-lg tracking-tight text-black dark:text-white",
  a: [
    'anchor',
    'font-bold',
    'text-stone-900',
    'dark:text-white',
    'border-b',
    'border-primary-400',
    'hover:border-b-2',
  ].join(' '),
  ul: 'ml-4 my-4 space-y-1 list-disc list-outside text-sm',
  li: 'text-stone-700 dark:text-white/60',
  code: code => code.hasParent('pre') ? '' : [
    'inline-block',
    'px-2',
    'rounded',
    'font-bold',
    'text-sm',

    // Color
    'text-secondary-700',
    'bg-primary-50',

    // Dark
    'dark:text-secondary-300',
    'dark:bg-primary-900',
  ].join(' '),
  pre: [
    'text-sm',
    'my-8',
    'ring-1',
    'p-4',
    'rounded-md',
    'shadow-lg',
    'overflow-x-auto',

    // Color
    'text-stone-900',
    'bg-primary-50',
    'ring-primary-200',

    // Dark
    'dark:ring-primary-500',
    'dark:bg-primary-900',
    'dark:ring-primary-500',
    'dark:text-white',
  ].join(' '),
}
