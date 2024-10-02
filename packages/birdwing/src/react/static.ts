import Markdoc, { RenderableTreeNode, RenderableTreeNodes } from '@markdoc/markdoc';

import type { ComponentType } from 'react';
import React from 'react';
import ReactDOMServer from "react-dom/server";

const { Tag } = Markdoc;

type Component = ComponentType<unknown>;

function tagName(
  name: string,
  components: Record<string, Component> | ((string: string) => Component)
): string | Component {
  return typeof name !== 'string'
    ? 'Fragment'
    : name[0] !== name[0].toUpperCase()
    ? name
    : components instanceof Function
    ? components(name)
    : components[name];
}

function renderArray(children: RenderableTreeNode[], component: (name: string) => any): string {
  return children.map(c => render(c, component)).join(', ');
}

function deepRender(value: any, component: (name: string) => any): any {
  if (value === undefined) {
    return 'undefined';
  }

  if (value == null || typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value))
    return `[${value.map((item) => deepRender(item, component)).join(', ')}]`;

  if (value.$$mdtype === 'Tag') return render(value, component);

  if (typeof value !== 'object') return JSON.stringify(value);

  const object = Object.entries(value)
    .map(([k, v]) => [JSON.stringify(k), deepRender(v, component)].join(': '))
    .join(', ');

  return `{${object}}`;
}

function render(node: RenderableTreeNodes, component: (name: string) => any): string {
  if (Array.isArray(node))
    return `React.createElement(React.Fragment, null, ${renderArray(node, component)})`;

  if (node === null || typeof node !== 'object' || !Tag.isTag(node))
    return JSON.stringify(node);

  const {
    name,
    attributes: { class: className, ...attrs } = {},
    children = [],
  } = node;

  if (className) attrs.className = className;

  // Experimental idea of prerendering certain components
  const staticNodes: string[] = []

  if (staticNodes.indexOf(node.name) !== -1) {
    const cmp = Markdoc.renderers.react(node, React, { components: component })
    return ReactDOMServer.renderToString(cmp).replace(/<!--/g, '').replace(/-->/g, '');
  }

  return `React.createElement(
    tagName(${JSON.stringify(name)}, components),
    ${Object.keys(attrs).length == 0 ? 'null' : deepRender(attrs, component)},
    ${renderArray(children, component)})`;
}

export default function reactStatic(
  node: RenderableTreeNodes,
  component: (name: string) => any,
  { resolveTagName = tagName }: { resolveTagName?: typeof tagName } = {}
): string {
  // the resolveTagName function *must* be called tagName
  // throw an error if it does not
  if (resolveTagName.name !== 'tagName') {
    throw new Error('resolveTagName must be named tagName');
  }
  return `
  (({ React, components = {}} = {}) => {
    ${resolveTagName}
    return ${render(node, component)};
  })
`;
}

export class StaticRenderer {
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

    const components = (name: string) => {
      const ns = namespace(name);

      if (!this.isComponent(ns.component)) {
        throw Error(`Missing component '${ns.component}'`);
      }
      if (!this.isNode(ns.component, ns.node)) {
        throw Error(`Missing node '${ns.node}' in component '${ns.component}'`);
      }
      return (props: any) => this.components[ns.component][ns.node](props);
    }

    return reactStatic(renderable, components);
  }
}
