import { RenderableTreeNodes, Scalar, Tag } from '@markdoc/markdoc';
import React from 'react';
import type { ReactNode } from 'react';
import { Template } from './interfaces.js';

export class Renderer {
  private key: number = 0;

  constructor(private template: Template) {}

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
    
    if (className) attrs.className = className;

    attrs.k = this.key++;

    const elem = React.createElement(
      this.template.resolve(name),
      Object.keys(attrs).length == 0 ? null : this.deepRender(attrs),
      ...children.map((c, i) => this.render(c))
    );

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
