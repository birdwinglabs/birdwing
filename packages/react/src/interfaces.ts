export interface ComponentDescription<T extends Record<string, any> = Record<string, any>> {
  name: string;

  attributes: T;
}

export abstract class Template {
  abstract resolveId(component: ComponentDescription<any>, node?: string): string;

  abstract component(id: string): React.FunctionComponent<any>
}
