import {
  ComponentFactory,
  Element,
  ImagoMiddleware,
  MiddlewareFactory,
  NodeInfo,
  TemplateContext
} from "../interfaces";
import { NodeType } from '@birdwing/renderable';

export class ComponentMiddlewareFactory<T extends NodeType> extends MiddlewareFactory<T> {
  constructor(private fact: ComponentFactory<any>, private parentContext: Record<string, string> = {}) { super(); }

  createMiddleware(nodes: Record<number, NodeInfo>): ImagoMiddleware<Element<T>> {
    return () => elem => {
      const template = this.fact.createTemplate(nodes, elem.props, this.parentContext);

      return (
        <TemplateContext.Provider value={template}>
          { template.resolve(elem.name)(elem.props) }
        </TemplateContext.Provider>
      );
    }
  }
}
