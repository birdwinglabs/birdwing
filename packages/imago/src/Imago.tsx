import React, { createContext, useContext } from "react";
import { Template } from '@birdwing/react';
import { NodeConfig, TemplateConfig } from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { configureNode, makeElementFactory } from "./factory.js";

const TemplateContext = createContext<string | undefined>(undefined);

type Nodes = Record<string, React.FunctionComponent<any>>;
type Slots = Record<string, Nodes>;

export class Ordering {
  constructor(public readonly index: number, public readonly total: number) {}

  get isFirst() { return this.index === 0; }
  get isLast() { return this.index === this.total - 1; }
}

export const OrderingContext = createContext(new Ordering(0, 0));

export class Imago extends Template {
  constructor(
    public readonly name: string,
    private layout: React.FunctionComponent<any>,
    private children: Nodes,
    private slots: Slots,
    private fallback: (node: string) => React.FunctionComponent<any>,
  ) { super(); }

  static configure(config: TemplateConfig<any>) {
    const elementsConfig = { ...defaultElements, ...config.elements };

    const makeNode = (name: string, config: NodeConfig<any>) => {
      const fact = makeElementFactory(elementsConfig, name);
      return configureNode(fact, config);
    }

    const layout: React.FunctionComponent<any> = makeNode('layout', config.layout);
    const children: Record<string, React.FunctionComponent<any>> = {};
    const slots: Record<string, Record<string, React.FunctionComponent<any>>> = {};

    for (const [name, nodeConfig] of Object.entries(config.children || {})) {
      children[name] = makeNode(name, nodeConfig);
    }
    for (const [slotName, slotConfig] of Object.entries(config.slots || {})) {
      slots[slotName] = {};
      for (const [name, nodeConfig] of Object.entries(slotConfig || {})) {
        slots[slotName][name] = makeNode(name, nodeConfig);
      }
    }

    return new Imago(config.name, layout, children, slots, node => makeElementFactory(elementsConfig, node));
  }

  static slot(name: string, children: React.ReactNode[]) {
    return <TemplateContext.Provider value={name}>{ children }</TemplateContext.Provider>;
  }

  static ordered = (children: React.ReactElement[]) => {
    const total = React.Children.count(children);

    const ordered = React.Children.map(children, (c, i) =>
      <OrderingContext.Provider value={new Ordering(i, total)}>
        { c }
      </OrderingContext.Provider> 
    )
    return ordered;
  }

  resolve(node: string, slot?: string) {
    if (node === 'layout') {
      return (props: any) => (
        <TemplateContext.Provider value={undefined}>
          { this.layout(props) }
        </TemplateContext.Provider>
      );
    }

    const Component: React.FunctionComponent = (props: any) => {
      const context = useContext(TemplateContext) || slot;

      if (context) {
        if (this.slots[context] && this.slots[context][node]) {
          return this.slots[context][node](props);
        }
      } else if (this.children[node]) {
        return this.children[node](props);
      }
      return this.fallback(node)(props);
    }

    Component.displayName = node;
    return Component;
  }
}
