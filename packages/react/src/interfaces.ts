export abstract class Template {
  abstract resolve(component: string, node?: string): React.FunctionComponent<any>;
}
