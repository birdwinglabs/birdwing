import React, { createContext } from "react";
import { NodeProps, NodeType, TagProps, Newable } from "./interfaces";
import { schema, Type } from './schema';

interface Property {
  name: string;
  value: any;
  key: number;
}

export class TypeMap {
  public types: Map<number, any> = new Map();

  constructor(private schema: Record<string, Type<any>>) {}

  get(key: number) {
    return this.types.has(key) ? this.types.get(key) : {};
  }

  parse(tag: NodeType, props: NodeProps): Property {
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

    return { name: props.property as string, key: props.k, value: this.parseValue(tag, props) };
  }

  private * parseProperties(props: NodeProps): Generator<Property> {
    for (const c of React.Children.toArray(props.children)) {
      if (React.isValidElement(c)) {
        if (c.props.property) {
          const p = this.parse((c.type as any).displayName, c.props);
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

  private parseValue<T extends NodeType>(tag: NodeType, props: TagProps<T>) {
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
    //switch (tag) {
      //case 'link': return props.href;
      //case 'item':
      //case 'paragraph':
      //case 'heading':
        //return props.children?.toString();
      //case 'value':
        //return props.content ? props.content : props.children?.toString();
      //default:
        //return undefined;
    //}
  }
}

export const TypeContext = createContext<TypeMap>(new TypeMap({}));
