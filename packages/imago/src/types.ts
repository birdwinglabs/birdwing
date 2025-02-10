import React from "react";
import { NodeProps, TagProps, NodeInfo } from "./interfaces";
import { Type, NodeType } from "@birdwing/renderable";

export function trimNamespace(name: string) {
  return name.includes(':') ? name.split(':').at(-1) : name;
}

export class NodeTree {
  public nodes: Record<number, NodeInfo> = {};

  constructor(private schema: Record<string, Type<any>>) {}

  process(tagName: string, props: NodeProps, parentKey: number | undefined = undefined, instanceKey: number | undefined = undefined) {
    let meta: any = undefined;

    const type = props.typeof ? trimNamespace(props.typeof) : undefined;

    if (type) {
      if (this.schema[type]) {
        meta = this.schema[type].create();
      }
    }

    const instance = instanceKey !== undefined ? this.nodes[instanceKey].meta : undefined;
    const property = props.property ? trimNamespace(props.property) : undefined;

    if (property && instance) {
      if (property in instance) {
        const value = meta ? meta : this.parseValue(props);

        if (Array.isArray(instance[property])) {
          instance[property].push(value);
        } else {
          instance[property] = value;
        }
      }
    }

    if (property && instanceKey !== undefined) {
      this.nodes[instanceKey].properties[property] = props.k;
    }

    if (props['data-name'] && instanceKey !== undefined) {
      this.nodes[instanceKey].refs[props['data-name']] = props.k;
    }
    
    if (parentKey !== undefined) {
      this.nodes[parentKey].children.push(props.k);
    }

    this.nodes[props.k] = {
      name: tagName,
      element: undefined,
      children: [],
      refs: {},
      properties: {},
      parent: parentKey,
      property: props.property,
      typeof: props.typeof,
      meta,
    };

    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        this.process((c.type as any).displayName, c.props, props.k, meta ? props.k : instanceKey);
        this.nodes[c.props.k].element = c;
      }
    }
  }

  private parseValue<T extends NodeType>(props: TagProps<T>) {
    if (props.href) {
      return props.href;
    }
    if (props.src) {
      return props.src;
    }
    if (props.content) {
      return props.content;
    }
    return props.children?.toString();
  }
}
