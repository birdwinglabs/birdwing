export type RenderFunction<T> = (props: T) => React.ReactNode;

export abstract class Template {
  abstract resolve(node: string, slot?: string): RenderFunction<any>;
}
