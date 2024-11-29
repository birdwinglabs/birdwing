import { RenderableTreeNodes, Scalar, Tag } from '@markdoc/markdoc';
import React from 'react';
import type { ReactNode } from 'react';
import { Template } from './interfaces.js';

function isUppercase(word: string){
  return /^\p{Lu}/u.test(word);
}

export class Renderer {
  private stack: string[] = [];

  constructor(private components: Record<string, Template>) {}

  isComponent(name: string) {
    return name in this.components;
  }

  private resolveTagName(tagName: string) {
    if (isUppercase(tagName)) {
      const template = this.components[tagName];
      return template.resolve('layout');
    } else {
      const componentName = this.stack.at(-1);
      if (componentName) {
        const template = this.components[componentName];
        return template.resolve(tagName);
      } else {
        throw Error('No component tag from stack');
      }
    }
  }

  render(node: RenderableTreeNodes): ReactNode {
    if (Array.isArray(node))
      return React.createElement(React.Fragment, null, ...node.map(n => this.render(n)));

    if (node === null || typeof node !== 'object' || !Tag.isTag(node))
      return node as any;

    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = [],
    } = node;

    if (isUppercase(name)) {
      this.stack.push(name);
    }

    if (className) attrs.className = className;

    const elem = React.createElement(
      this.resolveTagName(name),
      Object.keys(attrs).length == 0 ? null : this.deepRender(attrs),
      ...children.map(c => this.render(c))
    );

    if (isUppercase(name)) {
      this.stack.pop();
    }

    return elem;
  }

  private deepRender(value: any): any {
    if (value == null || typeof value !== 'object') return value;

    if (Array.isArray(value)) return value.map((item) => this.deepRender(item));

    if (value.$$mdtype === 'Tag') return this.render(value);

    if (typeof value !== 'object') return value;

    const output: Record<string, Scalar> = {};
    for (const [k, v] of Object.entries(value)) output[k] = this.deepRender(v);
    return output;
  }
}
