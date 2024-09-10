import { FragmentDocument, PageDocument, Route, Transformer } from "./interfaces.js";

export type RouteCallback<T extends Route<any>> = (route: T) => void;

type FragmentTransform<T extends Route<any>> = (fragment: FragmentDocument) => RouteCallback<T>;

export interface PluginConfig<T extends Route<any>> {
  page(page: PageDocument): T;

  fragments: Record<string, FragmentTransform<T>>;
} 

export type PluginMounter<T extends Route<any>> = (transformer: Transformer, path: string) => PluginConfig<T>;

export function createPlugin<T extends Route<any>>(
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
