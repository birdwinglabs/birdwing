import {
  ComponentFactory,
  Element,
  ImagoMiddleware,
  MiddlewareFactory,
  NodeInfo,
  NodeType,
  TemplateContext
} from "../interfaces";

export class ComponentMiddlewareFactory<T extends NodeType> extends MiddlewareFactory<T> {
  constructor(private fact: ComponentFactory<any>) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    return () => elem => {
      const template = this.fact.createTemplate(nodes, elem.props);

      return (
        <TemplateContext.Provider value={template}>
          { template.resolve(elem.name)(elem.props) }
        </TemplateContext.Provider>
      );
    }
  }
}
