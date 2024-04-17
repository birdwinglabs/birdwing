import { program } from 'commander';
import { Aetlan, Target, Transform } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import { render } from './renderer.js';
import path from 'path';
import mustache from 'mustache';
import { AetlanDocs } from '@aetlan/docs';

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

  postRender: string[];

  components: string;
}

export class SvelteKitTarget implements Target {
  private tagsPrerender: Record<string, any> = {};

  constructor(
    private config: SvelteKitConfig
  ) {}

  async compile(name: string, filePath: string) {
      this.tagsPrerender[name] = await compile(filePath, this.config.path);
  }

  public get postRender(): string[] {
    return this.config.postRender;
  }

  public get components(): string {
    return path.join(this.config.path, this.config.components);
  }

  get transforms(): Record<string, Transform> {
    return {
      '+page.svelte': async doc => {
        const { data, renderable, customTags } = doc;

        return {
          path: path.join(this.config.path, 'src/routes', data.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags.filter((t: string) => this.config.postRender.includes(t)),
            body: render(renderable, this.tagsPrerender, this.config.postRender),
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

export function cli() {
  program
    .command('build')
    .argument('<src>', 'documentation folder')
    .argument('<dst>', 'destination project folder')
    .action(async (src: string, dst: string) => {
      new Aetlan()
        .pipeline({
          name: 'docs',
          source: new AetlanDocs({ path: src }),
          target: new SvelteKitTarget({
            path: dst,
            postRender: ['Route', 'Layout'],
            components: 'src/lib/components/*.svelte',
          })
        })
        .run();
    });

  program
    .command('watch')
    .argument('<src>', 'documentation folder')
    .argument('<dst>', 'destination project folder')
    .action(async (src: string, dst: string) => {
      //await svelteKitCompiler(src, dst, aetlan => aetlan.watch());
    });

  program.parse();
}
