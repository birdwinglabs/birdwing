import MarkdownIt from 'markdown-it';
import markdoc from '@markdoc/markdoc';
import { SvelteComponent } from './interfaces';
const { escapeHtml } = MarkdownIt().utils;

const { Tag } = markdoc;

// HTML elements that do not have a matching close tag
// Defined in the HTML standard: https://html.spec.whatwg.org/#void-elements
const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export function render(node: any, components: Record<string, SvelteComponent>): string {
  const uc_map: Record<string, string> = {
    '{': '&lcub;',
    '}': '&rcub;',
  };

  const uc_regular_expression = new RegExp(Object.keys(uc_map).join('|'), 'gi');

  if (typeof node === 'string' || typeof node === 'number') {
    return escapeHtml(String(node))
      .replace(
        uc_regular_expression,
        (matched) => uc_map[matched.toLowerCase()],
      );
  }

  if (Array.isArray(node)) return node.map(n => render(n, components)).join('');

  if (node === null || typeof node !== 'object' || !Tag.isTag(node)) return '';

  const { name, attributes, children = [] } = node;

  if (name in components && components[name].render) {
    return components[name].render(attributes, { default: () => render(children, components) });
  }

  if (!name) return render(children, components);

  let output = '';

  if (name === 'Layout') {
    output = "<Layout {...data}>";
  } else {
    if (name in components && !components[name].render) {
      output = `<${name}`;
      for (const [k, v] of Object.entries(attributes ?? {})) {
        let value;
        if (typeof v === 'string') {
          value = `"${escapeHtml(String(v))}"`;
        } else {
          value = `{${v}}`;
        }
        output += ` ${k.toLowerCase()}=${value}`;
      }
      output += '>';
    } else {
      output = `<${name}`;
      for (const [k, v] of Object.entries(attributes ?? {})) {
        output += ` ${k.toLowerCase()}="${escapeHtml(String(v))}"`;
      }
      output += '>';
    }
  }

  if (voidElements.has(name)) return output;

  if (children.length) output += render(children, components);
  output += `</${name}>`;

  return output;
}
