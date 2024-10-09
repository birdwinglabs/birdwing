import React, { createContext, useContext } from "react";
import { NodeConfig, RenderFunction, TemplateConfig } from "./interfaces.js";
import { defaultElements } from "./Elements.js";
import { configureNode, makeElementFactory } from "./factory.js";

const TemplateContext = createContext<string | undefined>(undefined);

type Nodes = Record<string, RenderFunction<any>>;
type Slots = Record<string, Nodes>;

export class Template {
  constructor(
    public readonly name: string,
    private layout: RenderFunction<any>,
    private children: Nodes,
    private slots: Slots,
    private fallback: (node: string) => RenderFunction<any>,
  ) {}

  static configure(config: TemplateConfig<any>) {
    const elementsConfig = { ...defaultElements, ...config.elements };

    const makeNode = (name: string, config: NodeConfig<any>) => {
      const fact = makeElementFactory(elementsConfig, name);
      return configureNode(fact, config);
    }

    const layout: RenderFunction<any> = makeNode('layout', config.layout);
    const children: Record<string, RenderFunction<any>> = {};
    const slots: Record<string, Record<string, RenderFunction<any>>> = {};

    for (const [name, nodeConfig] of Object.entries(config.children || {})) {
      children[name] = makeNode(name, nodeConfig);
    }
    for (const [slotName, slotConfig] of Object.entries(config.slots || {})) {
      slots[slotName] = {};
      for (const [name, nodeConfig] of Object.entries(slotConfig || {})) {
        slots[slotName][name] = makeNode(name, nodeConfig);
      }
    }

    return new Template(config.name, layout, children, slots, node => makeElementFactory(elementsConfig, node));
  }

  static slot(name: string, children: React.ReactNode[]) {
    return <TemplateContext.Provider value={name}>{ children }</TemplateContext.Provider>;
  }

  resolve(node: string, slot?: string) {
    if (node === 'layout') {
      return (props: any) => (
        <TemplateContext.Provider value={undefined}>
          { this.layout(props) }
        </TemplateContext.Provider>
      );
    }

    return (props: any) => {
      const context = useContext(TemplateContext) || slot;

      if (context) {
        if (this.slots[context] && this.slots[context][node]) {
          return this.slots[context][node](props);
        }
      } else {
        if (this.children[node]) {
          return this.children[node](props);
        }
      }
      return this.fallback(node)(props);
    }
  }
}
