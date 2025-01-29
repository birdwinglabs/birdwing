import React from "react";
import { NodeProps, NodeType, TagProps, NodeInfo } from "./interfaces";
import { Type } from './schema';

export class NodeTree {
  public nodes: Record<number, NodeInfo> = {};

  constructor(private schema: Record<string, Type<any>>) {}

  process(tagName: string, props: NodeProps, parent: number | undefined = undefined, parentMeta: any = undefined) {
    let meta: any = undefined;

    if (props.typeof) {
      if (this.schema[props.typeof]) {
        meta = this.schema[props.typeof].create();
      }
    }

    const property = props.property;

    if (property && parentMeta !== undefined) {
      if (property in parentMeta) {
        const value = meta ? meta : this.parseValue(props);

        if (Array.isArray(parentMeta[property])) {
          parentMeta[property].push(value);
        } else {
          parentMeta[property] = value;
        }
      }
    }
    
    if (parent !== undefined) {
      this.nodes[parent].children.push(props.k);
    }

    this.nodes[props.k] = {
      name: tagName,
      children: [],
      parent,
      property: props.property,
      typeof: props.typeof,
      meta,
    };

    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        this.process((c.type as any).displayName, c.props, props.k, meta ? meta : parentMeta);
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
