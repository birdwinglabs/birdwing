export abstract class Template {
  abstract resolve(node: string, slot?: string): React.FunctionComponent<any>;
}
