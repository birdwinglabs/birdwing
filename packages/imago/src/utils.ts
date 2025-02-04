import { NodeInfo, NodeProps } from "./interfaces";

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

//export function makeRenderProps(props: NodeProps, nodes: Record<number, NodeInfo>) {
  //return {
    //...props,
    //Slot: makeSlot(props.children, nodes, props.k),
  //};
//}

export function makeNodeSlot(children: React.ReactNode) {
  return () => {
    return children;
  }
}

export function makeComponentSlot(children: React.ReactNode, nodes: Record<number, NodeInfo>, key: number) {
  return ({ name, property }: any) => {
    if (name) {
      const refKey = nodes[key].refs[name];
      return refKey ? nodes[refKey].element: '';
    } else if (property) {
      const refKey = nodes[key].properties[property];
      return refKey ? nodes[refKey].element: '';
    } else {
      return children;
    }
  }
}
