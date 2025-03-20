import React, { useContext } from "react";
import {
  AbstractTemplate,
  NodeProps,
  TemplateContext,
  ComponentFactory,
} from "./interfaces";
import { schema } from "@birdwing/renderable";
import { ReactElementWrapper } from "./types";

export class Theme extends AbstractTemplate {
  private templates: Record<string, ComponentFactory<any>> = {};

  constructor(templates: ComponentFactory<any>[]) {
    super();
    for (const t of templates) {
      this.templates[t.type] = t;
    }
  }

  resolve(node: string): React.FunctionComponent<any> {
    const Component: React.FunctionComponent = (props: NodeProps) => {
      const template = useContext(TemplateContext)

      if (template && template !== this) {
        return template.resolve(node)(props);
      } else if (props.typeof && this.templates[props.typeof]) {
        const wrapper = new ReactElementWrapper(React.createElement(node, props));
        const info = wrapper.info(schema);
        const t = this.templates[props.typeof].createTemplate(info, props);
        return (
          <TemplateContext.Provider value={t}>
            { t.resolve(node)(props) }
          </TemplateContext.Provider>
        )
      }
      return null;
    }

    Component.displayName = node;
    return Component;
  }
}

export function createTheme(components: ComponentFactory<any>[]): AbstractTemplate {
  return new Theme(components);
}
