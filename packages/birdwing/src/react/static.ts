import Markdoc, { RenderableTreeNode, RenderableTreeNodes } from '@markdoc/markdoc';

import type { ComponentType } from 'react';

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

function renderArray(children: RenderableTreeNode[]): string {
  return children.map(render).join(', ');
}

function deepRender(value: any): any {
  if (value === undefined) {
    return 'undefined';
  }

  if (value == null || typeof value !== 'object') return JSON.stringify(value);

  if (Array.isArray(value))
    return `[${value.map((item) => deepRender(item)).join(', ')}]`;

  if (value.$$mdtype === 'Tag') return render(value);

  if (typeof value !== 'object') return JSON.stringify(value);

  const object = Object.entries(value)
    .map(([k, v]) => [JSON.stringify(k), deepRender(v)].join(': '))
    .join(', ');

  return `{${object}}`;
}

function render(node: RenderableTreeNodes): string {
  if (Array.isArray(node))
    return `React.createElement(React.Fragment, null, ${renderArray(node)})`;

  if (node === null || typeof node !== 'object' || !Tag.isTag(node))
    return JSON.stringify(node);

  const {
    name,
    attributes: { class: className, ...attrs } = {},
    children = [],
  } = node;

  if (className) attrs.className = className;

  return `React.createElement(
    tagName(${JSON.stringify(name)}, components),
    ${Object.keys(attrs).length == 0 ? 'null' : deepRender(attrs)},
    ${renderArray(children)})`;
}

export default function reactStatic(
  node: RenderableTreeNodes,
  { resolveTagName = tagName }: { resolveTagName?: typeof tagName } = {}
): string {
  // the resolveTagName function *must* be called tagName
  // throw an error if it does not
  if (resolveTagName.name !== 'tagName') {
    throw new Error('resolveTagName must be named tagName');
  }
  return `
  (({components = {}} = {}) => {
    ${resolveTagName}
    return ${render(node)};
  })
`;
}

export class StaticRenderer {
  render(renderable: any) {
    const namespace = (name: string) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        return { component: ns[0], node: ns[1] };
      } else {
        return { component: name, node: 'layout' };
      }
    }

    return reactStatic(renderable)
    
    //, { components: (name: string) => { const ns = namespace(name);

      //if (!this.isComponent(ns.component)) {
        //throw Error(`Missing component '${ns.component}'`);
      //}
      //if (!this.isNode(ns.component, ns.node)) {
        //throw Error(`Missing node '${ns.node}' in component '${ns.component}'`);
      //}
      //return (props: any) => this.components[ns.component][ns.node](props);
    //}});
  }
}