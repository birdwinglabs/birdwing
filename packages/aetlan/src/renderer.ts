import Markdoc from '@markdoc/markdoc';
import React from 'react';

export class Renderer {
  constructor(private components: any) {}


  isComponent(name: string) {
    return name in this.components;
  }

  isNode(component: string, name: string) {
    return this.isComponent(component) && name in this.components[component];
  }

  render(renderable: any) {
    const namespace = (name: string) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        return { component: ns[0], node: ns[1] };
      } else {
        return { component: name, node: 'layout' };
      }
    }

    return Markdoc.renderers.react(renderable, React, { components: (name: string) => {
      const ns = namespace(name);

      if (!this.isComponent(ns.component)) {
        throw Error(`Missing component '${ns.component}'`);
      }
      if (!this.isNode(ns.component, ns.node)) {
        throw Error(`Missing node '${ns.node}' in component '${ns.component}'`);
      }
      return (props: any) => this.components[ns.component][ns.node](props);
    }});
  }
}
