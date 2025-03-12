export const Layout = ({children}: any) => {
  return (
    <div className="[--scroll-mt:9.875rem] lg:[--scroll-mt:6.3125rem] js-focus-visible bg-stone-50 dark:bg-primary-950 min-h-screen dark">
      {children}
    </div>
  );
}
