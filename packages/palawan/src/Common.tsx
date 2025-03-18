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

export function Container({ children }: any) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none">
        { children }
      </div>
    </div>
  );
}

export const buttons = {
  primary: [
    "px-3.5 py-2.5",

    "text-sm",
    "font-semibold",

    "rounded-md",
    "shadow-sm",

    // Light
    "bg-secondary-600",
    "text-white",
    "hover:bg-secondary-500",

    // Dark
    "dark:bg-secondary-600",
    "dark:hover:bg-secondary-400",
    "dark:hover:text-secondary-950",

    "focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-white"
  ].join(' '),
  secondary: [
    "text-sm",
    "font-semibold",
    "leading-6",

    // Light
    "text-black",
    "hover:text-secondary-600",

    // Dark
    "dark:text-white",
    "dark:hover:text-secondary-400",
  ].join(' ')
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

    // Light
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

    // Light
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
