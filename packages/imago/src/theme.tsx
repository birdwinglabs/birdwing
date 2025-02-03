import React, { useContext } from "react";
import {
  AbstractTemplate,
  NodeProps,
  TemplateContext,
  ComponentFactory,
  NodeTreeContext,
  ComponentClass,
} from "./interfaces";
import { NodeTree } from "./types";
import { schema } from "./schema";

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
        const nt = new NodeTree(schema);
        nt.process('document', props);
        const t = this.templates[props.typeof].createTemplate({ data: nt.nodes[0].meta, $class: new ComponentClass(props.className) });
        return (
          <TemplateContext.Provider value={t}>
            <NodeTreeContext.Provider value={nt.nodes}>
              { t.resolve(node)(props) }
            </NodeTreeContext.Provider>
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
