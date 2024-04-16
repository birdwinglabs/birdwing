import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import { compile } from './compiler.js';
import { render } from './renderer.js';
import path from 'path';
import fs from 'fs';
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

export function svelteKitCompiler(src: string, dst: string, fn: (aetlan: Aetlan) => Promise<void>) {
  const config: any = {
    postrender: ['Route', 'Layout'],
  }

  const componentsPath = path.join(dst, 'src/lib/components');
  const components = fs.readdirSync(componentsPath).map(file => path.basename(file, '.svelte'));

  const serverComponents = components.filter(x => !config.postrender.includes(x));

  return Aetlan
    .connect(src, components)
    .then(async aetlan => {
      const tagsPrerender: any = {};

      for (const name of serverComponents) {
        const componentPath = path.join(componentsPath, `${name}.svelte`);
        aetlan.logger.inScope('svelte compiler').info(`rollup: '${componentPath}'`);
        tagsPrerender[name] = await compile(componentPath, dst);
      }

      aetlan.transformDocument('+page.server.js', async doc => {
        return {
          _id: path.join(dst, 'src/routes', doc.data.slug, '+page.server.js'),
          content: mustache.render(pageServerTemplate, {
            data: JSON.stringify(doc.data),
          }),
        }
      });

      aetlan.transformDocument('+page.svelte', async doc => {
        const { data, renderable, customTags } = doc;

        return {
          _id: path.join(dst, 'src/routes', data.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags.filter((t: string) => config.postrender.includes(t)),
            body: render(renderable, tagsPrerender, config.postrender),
          }),
        }
      });

      await fn(aetlan);
    });
}

export function cli() {
  program
    .command('build')
    .argument('<src>', 'documentation folder')
    .argument('<dst>', 'destination project folder')
    .action(async (src: string, dst: string) => {
      await svelteKitCompiler(src, dst, aetlan => aetlan.build());
    });

  program
    .command('watch')
    .argument('<src>', 'documentation folder')
    .argument('<dst>', 'destination project folder')
    .action(async (src: string, dst: string) => {
      await svelteKitCompiler(src, dst, aetlan => aetlan.watch());
    });

  program.parse();
}
