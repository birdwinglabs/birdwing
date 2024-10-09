import Markdoc, { Tag } from '@markdoc/markdoc';
import React from 'react';
import { Template } from './Template.js';

export class Renderer {
  constructor(private components: Record<string, Template>) {}

  isComponent(name: string) {
    return name in this.components;
  }

  render(renderable: Tag) {
    const namespace = (name: string) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        if (ns.length === 2) {
          return { component: ns[0], node: ns[1] };
        } else {
          return { component: ns[0], slot: ns[1], node: ns[2] };
        }
      } else {
        return { component: name, node: 'layout' };
      }
    }

    return Markdoc.renderers.react(renderable, React, { components: (name: string) => {
      const ns = namespace(name);

      const template = this.components[ns.component];

      if (!template || !(template instanceof Template)) {
        throw Error(`Missing component '${ns.component}'`);
      }
      return template.resolve(ns.node, ns.slot);
    }});
  }
}
