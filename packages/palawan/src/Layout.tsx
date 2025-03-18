const className = [
  "[--scroll-mt:9.875rem] lg:[--scroll-mt:6.3125rem]",
  "min-h-screen",
  "js-focus-visible",
  "bg-stone-50 dark:bg-primary-950",
].join(' ');

export const Layout = ({ children }: any) => {
  return (
    <div className={className}>
      { children }
    </div>
  );
}
