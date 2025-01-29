import React, { createContext } from "react";
import { NodeProps, NodeType, TagProps, Newable, NodeInfo } from "./interfaces";
import { schema, Type } from './schema';

interface Property {
  name: string;
  value: any;
  key: number;
}


export class NodeTree {
  public nodes: Record<number, NodeInfo> = {};

  process(tagName: string, props: NodeProps, parent: number | undefined = undefined) {
    this.nodes[props.k] = {
      name: tagName,
      children: [],
      parent,
      property: props.property,
      typeof: props.typeof,
    };

    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        this.nodes[props.k].children.push(c.props.k);
        this.process((c.type as any).displayName, c.props, props.k);
      }
    }
  }
}

export class TypeMap {
  public types: Map<number, any> = new Map();
  public children: Record<number, number[]> = {};

  constructor(private schema: Record<string, Type<any>>) {}

  get(key: number) {
    return this.types.has(key) ? this.types.get(key) : {};
  }

  parse(props: NodeProps): Property {
    const childProps: Property[] = [...this.parseProperties(props)];

    if (props.typeof) {
      if (this.schema[props.typeof]) {
        const p: Property = {
          key: props.k,
          name: props.property as string,
          value: this.schema[props.typeof].create(),
        }

        for (const cp of childProps) {
          if (cp.name in p.value) {
            if (Array.isArray(p.value[cp.name])) {
              p.value[cp.name].push(cp.value);
            } else {
              p.value[cp.name] = cp.value;
            }
          }
        }

        this.types.set(p.key, p.value);
        return p;
      } else {
        return { name: props.property as string, key: props.k, value: undefined };
      }
    }

    return { name: props.property as string, key: props.k, value: this.parseValue(props) };
  }

  private * parseProperties(props: NodeProps): Generator<Property> {
    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        if (c.props.property) {
          const p = this.parse(c.props);
          yield p;
        }
        if (!c.props.typeof) {
          for (const p of this.parseProperties(c.props)) {
            yield p;
          }
        }
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

export const TypeContext = createContext<TypeMap>(new TypeMap({}));
