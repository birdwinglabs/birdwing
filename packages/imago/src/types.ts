import React from "react";
import { NodeInfo } from "./interfaces";
import { Type, AbstractElementWrapper } from "@birdwing/renderable";
import { TypeNode } from "@birdwing/renderable/dist/types";

export class ReactElementWrapper extends AbstractElementWrapper<React.ReactElement> {
  get attributes() {
    const { children, ...attributes } = this.elem.props;
    return attributes;
  }

  get children(): ReactElementWrapper[] {
    return React.Children
      .toArray(this.elem.props.children)
      .filter(c => React.isValidElement(c))
      .map(c => new ReactElementWrapper(c));
  }

  get text() {
    return this.elem.props.children.toString();
  }

  info(schema: Record<string, Type<any>>, dict: Record<number, NodeInfo> = {}, parent: number | undefined = undefined): Record<number, NodeInfo> {
    dict[this.attributes.k] = {
      element: this.elem,
      parent,
      children: this.children.map(c => c.attributes.k),
    }
    for (const c of this.children) {
      c.info(schema, dict, this.attributes.k);
    }

    if (parent === undefined) {
      const node = this.process(schema);
      if (node instanceof TypeNode) {
        for (const c of node.walk()) {
          dict[c.element.props.k].meta = c;
        }
      }
    }
    return dict;
  }
}
