import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import { compile, render } from './renderer.js';
import path from 'path';
import fs from 'fs';
import mustache from 'mustache';

const pageTemplate = `
<script>
  import Layout from '$lib/layouts/Docs.svelte';
{{#imports}}
  import {{.}} from '$lib/components/{{.}}.svelte';
{{/imports}}

  export let data;

  const { title, description, topic, slug, next, prev, headings } = data;
</script>

<Layout title={title} description={description} topic={topic} slug={slug} next={next} prev={prev} headings={headings}>
  <div slot="nav">
    {{{summary}}}
  </div>

  {{{body}}}
</Layout>
`;

const pageServerTemplate = `
/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {{{data}}}
}
`;

export function svelteKitCompiler(src: string, dst: string, fn: (aetlan: Aetlan) => Promise<void>) {
  const config: any = {
    postrender: ['Route'],
  }

  const componentsPath = path.join(dst, 'src/lib/components');
  const components = fs.readdirSync(componentsPath).map(file => path.basename(file, '.svelte'));

  const serverComponents = components.filter(x => !config.postrender.includes(x));

  return Aetlan
    .connect(src, components)
    .then(async aetlan => {
      const tagsPrerender: any = {};

      for (const name of serverComponents) {
        tagsPrerender[name] = await compile(path.join(componentsPath, `${name}.svelte`));
      }

      aetlan.transformDocument('+page.server.js', async doc => {
        const { frontmatter, topic, headings, next, prev } = doc;

        return {
          _id: path.join(dst, 'src/routes', frontmatter.slug, '+page.server.js'),
          content: mustache.render(pageServerTemplate, {
            data: JSON.stringify({ ...frontmatter, topic, headings, next, prev }, null, 2),
          }),
        }
      });

      aetlan.transformDocument('+page.svelte', async doc => {
        const { frontmatter, renderable, summary, customTags } = doc;

        return {
          _id: path.join(dst, 'src/routes', frontmatter.slug, '+page.svelte'),
          content: mustache.render(pageTemplate, {
            imports: customTags.filter((t: string) => config.postrender.includes(t)),
            body: render(renderable, tagsPrerender, config.postrender),
            summary: render(summary.renderable, tagsPrerender, config.postrender),
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
