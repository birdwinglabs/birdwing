import { Target, Transform } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import { render } from './renderer.js';
import path from 'path';
import mustache from 'mustache';
import { SvelteKitConfig, SvelteComponent } from './interfaces.js';

const pageTemplate = `
<script>
{{#imports}}
  import {{name}} from '$lib/{{{path}}}';
{{/imports}}

  export let data;
</script>

{{{body}}}
`;

const pageServerTemplate = `
/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {{{data}}}
}
`;


export class SvelteKitTarget implements Target {
  private components: Record<string, SvelteComponent> = {};

  constructor(
    private config: SvelteKitConfig
  ) {}

  async component(name: string, filePath: string, prerender: boolean) {
    this.components[name] = {
      path: filePath,
      render: prerender ? await compile(filePath, this.config.path) : false,
    };
  }

  get transforms(): Record<string, Transform> {
    return {
      '+page.svelte': async doc => {
        const { data, renderable, customTags } = doc;

        return {
          path: path.join(this.config.path, 'src/routes', data.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags
              .filter((t: string) => !this.components[t].render)
              .map((t: string) => {
                return {
                  name: t,
                  path: path.relative(path.join(this.config.path, 'src/lib'), this.components[t].path),
                }
              }),
            body: render(renderable, this.components),
          }),
        }
      },
      '+page.server.js': async doc => {
        return {
          path: path.join(this.config.path, 'src/routes', doc.data.slug, '+page.server.js'),
          content: mustache.render(pageServerTemplate, {
            data: JSON.stringify(doc.data),
          }),
        }
      }
    }
  }
}

export default function sveltekit(config: SvelteKitConfig) {
  return new SvelteKitTarget(config);
}
