import { program } from 'commander';
import { Aetlan, Target, Transform } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import { render } from './renderer.js';
import path from 'path';
import fs from 'fs';
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

  componentsPath: string;
}

export class SvelteKitTarget implements Target {
  private componentsPath: string;
  public components: string[];
  private tagsPrerender: Record<string, any> = {};

  constructor(
    private config: SvelteKitConfig
  ) {
    this.componentsPath = path.join(config.path, 'src/lib/components');
    this.components = fs.readdirSync(this.componentsPath).map(file => path.basename(file, '.svelte'));
  }

  async compile() {
    const serverComponents = this.components.filter(x => !this.config.postRender.includes(x));
    for (const name of serverComponents) {
      const componentPath = path.join(this.componentsPath, `${name}.svelte`);
      //aetlan.logger.inScope('svelte compiler').info(`rollup: '${componentPath}'`);
      this.tagsPrerender[name] = await compile(componentPath, this.config.path);
    }
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
      const target = new SvelteKitTarget({
        path: dst,
        postRender: ['Route', 'Layout'],
        componentsPath: 'src/lib/components',
      })
      const aetlan = new Aetlan();
      aetlan.pipeline({ name: 'docs', source: new AetlanDocs({ path: src, customTags: target.components }), target })
      await aetlan.run();
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
