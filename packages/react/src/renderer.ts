import { RenderableTreeNodes, Scalar, Tag } from '@markdoc/markdoc';
import React from 'react';
import type { ReactNode } from 'react';
import { ComponentDescription, Template } from './interfaces.js';

function isUppercase(word: string){
  return /^\p{Lu}/u.test(word);
}

export class Renderer {
  private stack: ComponentDescription<any>[] = [];

  constructor(private template: Template) {}

  render(node: RenderableTreeNodes, index: number = 0, isLast: boolean = false): ReactNode {
    if (Array.isArray(node))
      return React.createElement(React.Fragment, null, ...node.map(n => this.render(n)));

    if (node === null || typeof node !== 'object' || !Tag.isTag(node))
      return node as any;

    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = [],
    } = node;
    
    if (className) attrs.className = className;

    attrs.index = index;
    attrs.isLast = isLast;

    if (isUppercase(name)) {
      this.stack.push({ name, attributes: attrs });
    }
    const component = this.stack.at(-1);

    if (!component) {
      throw Error('No component tag from stack');
    }

    const childCount = children.length;

    const componentId = this.template.resolveId(component, name === component.name ? undefined : name);

    const elem = React.createElement(
      this.template.component(componentId),
      Object.keys(attrs).length == 0 ? null : this.deepRender(attrs),
      ...children.map((c, i) => this.render(c, i, i === childCount - 1))
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
