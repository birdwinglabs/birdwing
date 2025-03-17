import React, { useContext } from "react";
import {
  AbstractTemplate,
  NodeProps,
  TemplateContext,
  ComponentResolver,
  ComponentEntry,
} from "./interfaces";
import { schema } from "@birdwing/renderable";
import { ReactElementWrapper } from "./types";

export class Theme extends AbstractTemplate {
  private resolver: ComponentResolver;

  constructor(templates: ComponentEntry[]) {
    super();
    this.resolver = new ComponentResolver(templates);
  }

  resolve(node: string): React.FunctionComponent<any> {
    const Component: React.FunctionComponent = (props: NodeProps) => {
      const template = useContext(TemplateContext)

      if (template && template !== this) {
        return template.resolve(node)(props);
      } else if (props.typeof) {
        const fact = this.resolver.resolve(props.typeof);
        
        if (fact) {
          const wrapper = new ReactElementWrapper(React.createElement(node, props));
          const info = wrapper.info(schema);
          const t = fact.createTemplate(this.resolver, info, props);
          return (
            <TemplateContext.Provider value={t}>
              { t.resolve(node)(props) }
            </TemplateContext.Provider>
          )
        }
      }
      return null;
    }

    Component.displayName = node;
    return Component;
  }
}

export function createTheme(components: ComponentEntry[]): AbstractTemplate {
  return new Theme(components);
}
