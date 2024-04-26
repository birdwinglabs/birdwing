import { Target, Transform } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import { render } from './renderer.js';
import path from 'path';
import mustache from 'mustache';

const pageTemplate = `
<script>
{{#imports}}
  import {{.}} from '$lib/components/{{.}}.svelte';
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

interface SvelteKitConfig {
  path: string;
}

export class SvelteKitTarget implements Target {
  private tagsPrerender: Record<string, any> = {};
  private tagsPostrender: string[] = [];

  constructor(
    private config: SvelteKitConfig
  ) {}

  async component(name: string, filePath: string, prerender: boolean) {
    if (prerender) {
      this.tagsPrerender[name] = await compile(filePath, this.config.path);
    } else {
      this.tagsPostrender.push(name);
    }
  }

  get transforms(): Record<string, Transform> {
    return {
      '+page.svelte': async doc => {
        const { data, renderable, customTags } = doc;

        return {
          path: path.join(this.config.path, 'src/routes', data.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags.filter((t: string) => !(t in this.tagsPrerender)),
            body: render(renderable, this.tagsPrerender, this.tagsPostrender),
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
