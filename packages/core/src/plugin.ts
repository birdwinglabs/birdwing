import { FragmentDocument, PageDocument, Route, RouteData, Transformer } from "./interfaces.js";

export type Attributes = Record<string, any>;

export type RouteCallback<T extends RouteData> = (data: T) => void;

type FragmentTransform<T extends RouteData> = (fragment: FragmentDocument) => RouteCallback<T>;

export interface PluginConfig<T extends RouteData> {
  page(page: PageDocument): T;

  fragments: Record<string, FragmentTransform<T>>;

  compile(data: T): Route;
} 

export type PluginMounter<T extends RouteData> = (transformer: Transformer, path: string) => PluginConfig<T>;

export function createPlugin<T extends RouteData>(
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
