import React, { createContext } from "react";
import { NodeProps, NodeType, TagProps } from "./interfaces";

const listProps = new Set(['step', 'tab', 'panel', 'contentSection']);

interface Property {
  name: string;
  value: any;
  key: number;
}

export class TypeMap {
  public types: Map<number, any> = new Map();

  get(key: number) {
    return this.types.has(key) ? this.types.get(key) : {};
  }

  parse(tag: NodeType, props: NodeProps): Property {
    const childProps: Property[] = [...this.parseProperties(props)]

    if (childProps.length === 0) {
      if (props.typeof) {
        return { name: props.property as string, key: props.k, value: { '@type': props.typeof }};
      }
      return { name: props.property as string, key: props.k, value: this.parseValue(tag, props) };
    }

    const p: Property = {
      key: props.k,
      name: props.property as string,
      value: { '@type': props.typeof },
    }

    for (const cp of childProps) {
      if (listProps.has(cp.name)) {
        if (!p.value[cp.name]) {
          p.value[cp.name] = [];
        }
        p.value[cp.name].push(cp.value);
      } else {
        p.value[cp.name] = cp.value;
      }
    }

    this.types.set(p.key, p.value);

    return p;
  }

  private * parseProperties(props: NodeProps): Generator<Property> {
    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        if (c.props.property) {
          const p = this.parse((c.type as any).displayName, c.props);
          yield p;
        } else {
          for (const p of this.parseProperties(c.props)) {
            yield p;
          }
        }
      }
    }
  }

  private parseValue<T extends NodeType>(tag: NodeType, props: TagProps<T>) {
    switch (tag) {
      case 'link': return props.href;
      case 'item':
      case 'paragraph':
      case 'heading':
        return props.children?.toString();
      case 'value':
        return props.content;
      default:
        return undefined;
    }
  }
}

export const TypeContext = createContext<TypeMap>(new TypeMap());
