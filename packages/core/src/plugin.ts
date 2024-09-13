import { FragmentDocument, PageDocument, Route, Transformer } from "./interfaces.js";

export type Attributes = Record<string, any>;

export type RouteCallback<T extends Attributes> = (route: Route<T>) => void;

type FragmentTransform<T extends Attributes> = (fragment: FragmentDocument) => RouteCallback<T>;

export interface PluginConfig<T extends Attributes> {
  page(page: PageDocument): Route<Partial<T>>;

  fragments: Record<string, FragmentTransform<T>>;
} 

export type PluginMounter<T extends Attributes> = (transformer: Transformer, path: string) => PluginConfig<T>;

export function createPlugin<T extends Attributes>(
  name: string,
  mount: PluginMounter<T>
) {
  return new Plugin(name, mount);
}

export class Plugin {
  constructor(public name: string, private mounter: PluginMounter<any>) {}

  mount(path: string, transformer: Transformer) {
    return this.mounter(transformer, path);
  }
}
