import Markdoc from '@markdoc/markdoc';
import React from 'react';

const { Tag } = Markdoc;

function isUppercase(word: string){
  return /^\p{Lu}/u.test(word);
}

export class Renderer {
  constructor(private components: any) {}

  applyNamespace(tag: any, component?: string) {
    if (!isUppercase(tag.name) && component) {
      tag.name = `${component}.${tag.name}`;
    } else {
      component = tag.name;
    }
    for (const attr of Object.values(tag.attributes)) {
      if (attr instanceof Tag) {
        this.applyNamespace(attr, component);
      }
      if (Array.isArray(attr)) {
        for (const child of attr) {
          if (child instanceof Tag) {
            this.applyNamespace(child, component);
          }
        }
      }
    }
    for (const child of tag.children) {
      if (child instanceof Tag) {
        this.applyNamespace(child, component);
      }
    }
  }

  isComponent(name: string) {
    return name in this.components;
  }

  isNode(component: string, name: string) {
    return this.isComponent(component) && name in this.components[component];
  }

  render(renderable: any) {
    this.applyNamespace(renderable);

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
