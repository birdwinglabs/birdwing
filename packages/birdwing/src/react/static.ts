import { Template } from '@birdwing/react';
import Markdoc, { RenderableTreeNode, RenderableTreeNodes } from '@markdoc/markdoc';

const { Tag } = Markdoc;

export class StaticRenderer {
  constructor(private theme: Template) {}

  render(node: RenderableTreeNodes): string {
    return `
    (({ React, theme = {}} = {}) => {
      const c = (name, attr, ...children) => React.createElement(theme.resolve(name), attr, ...children);

      return ${this.renderNodes(node)};
    })
  `;
  }

  private renderArray(children: RenderableTreeNode[]): string {
    return children.map(c => this.renderNodes(c)).join(', ');
  }

  private deepRender(value: any): any {
    if (value === undefined) {
      return 'undefined';
    }

    if (value == null || typeof value !== 'object') return JSON.stringify(value);

    if (Array.isArray(value))
      return `[${value.map((item) => this.deepRender(item)).join(', ')}]`;

    if (value.$$mdtype === 'Tag') return this.renderNodes(value);

    if (typeof value !== 'object') return JSON.stringify(value);

    const object = Object.entries(value)
      .map(([k, v]) => [JSON.stringify(k), this.deepRender(v)].join(': '))
      .join(', ');

    return `{${object}}`;
  }

  private renderNodes(node: RenderableTreeNodes, index: number = 0, isLast: boolean = false): string {
    if (Array.isArray(node))
      return `React.createElement(React.Fragment, null, ${this.renderArray(node)})`;

    if (node === null || typeof node !== 'object' || !Tag.isTag(node))
      return JSON.stringify(node);

    const {
      name,
      attributes: { class: className, ...attrs } = {},
      children = [],
    } = node;

    if (className) attrs.className = className;

    attrs.index = index;
    attrs.isLast = isLast;

    const childCount = children.length;

    const elem = `c(${JSON.stringify(name)},
      ${Object.keys(attrs).length == 0 ? 'null' : this.deepRender(attrs)},
      ${this.renderArray(children)})`;
    
    return elem;
  }
}
