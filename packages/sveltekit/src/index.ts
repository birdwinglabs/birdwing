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

export class SvelteKitTarget implements Target {
  static async create(dst: string) {
    const config: any = {
      postrender: ['Route', 'Layout'],
    }

    const componentsPath = path.join(dst, 'src/lib/components');
    const components = fs.readdirSync(componentsPath).map(file => path.basename(file, '.svelte'));

    const serverComponents = components.filter(x => !config.postrender.includes(x));
    const tagsPrerender: any = {};

    for (const name of serverComponents) {
      const componentPath = path.join(componentsPath, `${name}.svelte`);
      //aetlan.logger.inScope('svelte compiler').info(`rollup: '${componentPath}'`);
      tagsPrerender[name] = await compile(componentPath, dst);
    }

    return new SvelteKitTarget(tagsPrerender, components, dst, config);
  }

  constructor(
    private tagsPrerender: Record<string, any>,
    public readonly components: string[],
    private dst: string,
    private config: any
  ) {}

  get transforms(): Record<string, Transform> {
    return {
      '+page.svelte': async doc => {
        const { data, renderable, customTags } = doc;

        return {
          path: path.join(this.dst, 'src/routes', data.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags.filter((t: string) => this.config.postrender.includes(t)),
            body: render(renderable, this.tagsPrerender, this.config.postrender),
          }),
        }
      },
      '+page.server.js': async doc => {
        return {
          path: path.join(this.dst, 'src/routes', doc.data.slug, '+page.server.js'),
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
      const target = await SvelteKitTarget.create(dst);
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
