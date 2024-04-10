import MarkdownIt from 'markdown-it';
import markdoc from '@markdoc/markdoc';
const { escapeHtml } = MarkdownIt().utils;
import { rollup } from 'rollup';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import vm from 'vm';
import path from 'path';
import svelte from 'rollup-plugin-svelte';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const { Tag } = markdoc;

export async function compile(filepath: string) {
  const bundle = await rollup({
    input: filepath,
    external: ['svelte/internal'],
    plugins: [
      // @ts-ignore
      svelte({
        compilerOptions: { generate: 'ssr', preserveComments: true },
        onwarn: () => {},
      }),
      nodeResolve({
        moduleDirectories: ['/home/bander10/Documents/code/svelte-docs/node_modules']
      }),
      commonjs(),
    ],
  });
  const generated = await bundle.generate({ format: 'cjs', exports: 'default' });
  const code = generated.output[0].code;
  const result = {};
  const bindings = {};

  return (props: any, slots: any) => {
    const sandbox = {
      require: createRequire(import.meta.url),
      __dirname: path.dirname(fileURLToPath(import.meta.url)),
      console,
      module: {}
    };
    const html = vm
      .runInNewContext(code, sandbox)
      .$$render(result, props, bindings, slots);

    return html;
  }
}

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

export function render(node: any, tagsPrerender: any, tagsPostrender: string[]): string {
  if (typeof node === 'string' || typeof node === 'number')
    return escapeHtml(String(node));

  if (Array.isArray(node)) return node.map(n => render(n, tagsPrerender, tagsPostrender)).join('');

  if (node === null || typeof node !== 'object' || !Tag.isTag(node)) return '';

  const { name, attributes, children = [] } = node;

  if (name in tagsPrerender) {
    return tagsPrerender[name](attributes, { default: () => render(children, tagsPrerender, tagsPostrender) });
  }

  if (!name) return render(children, tagsPrerender, tagsPostrender);

  let output = '';

  if (tagsPostrender.includes(name)) {
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


  if (voidElements.has(name)) return output;

  if (children.length) output += render(children, tagsPrerender, tagsPostrender);
  output += `</${name}>`;

  return output;
}
