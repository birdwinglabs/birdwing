import { TypeNode } from "@birdwing/renderable/dist/types";
import { NodeInfo } from "./interfaces";

export function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeDeep(target: any, ...sources: any[]) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

export function makeNodeSlot(children: React.ReactNode) {
  return () => {
    return children;
  }
}

export function makeComponentSlot(children: React.ReactNode, nodes: Record<number, NodeInfo>, key: number) {
  return ({ name, property }: any) => {
    if (name) {
      if (nodes[key].meta instanceof TypeNode) {
        return nodes[key].meta.refs[name];
      }
      return '';
      //const refKey = nodes[key].refs[name];
      //return refKey ? nodes[refKey].element: '';
    } else if (property) {
      if (nodes[key].meta instanceof TypeNode) {
        return nodes[key].meta.propertyNodes
          .filter(p => p.propertyName === property)
          .map(p => p.element);

      }
      return '';
      //const refKey = nodes[key].properties[property];
      //return refKey ? nodes[refKey].element: '';
    } else {
      return children;
    }
  }
}
