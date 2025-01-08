export abstract class Template {
  abstract resolve(node: string): React.FunctionComponent<any>;
}
