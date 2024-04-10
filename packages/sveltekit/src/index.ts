import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import { compile, render } from './renderer.js';
import path from 'path';
import fs from 'fs';

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
    {{{sidenav}}}
  </div>

  {{{svelteBody}}}
</Layout>
`;

const pageServerTemplate = `
/** @type {import('./$types').PageServerLoad} */
export async function load() {
  return {{{data}}}
}
`;

const sideNavTags = ['SideNav', 'Menu', 'MenuItem', 'Route'];

export async function build(src: string, dst: string) {
  const config: any = {
    postrender: ['Route'],
  }

  const componentsPath = path.join(dst, 'src/lib/components');
  const components = fs.readdirSync(componentsPath).map(file => path.basename(file, '.svelte'));

  const serverComponents = components.filter(x => !config.postrender.includes(x));

  return Aetlan
    .connect(src)
    .then(async aetlan => {
      const tagsPrerender: any = {};

      for (const name of serverComponents) {
        tagsPrerender[name] = await compile(path.join(componentsPath, `${name}.svelte`));
      }

      const sideNavRender = await aetlan.createSideNavRenderer((node: any) => render(node, tagsPrerender, config.postrender));

      const docs = await aetlan.documents([
        {
          $facet: {
            '+page.server.js': [
              { $match: { path: { $nin: [ 'SUMMARY.md' ] } } },
              {
                $project: {
                  _id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.server.js'] },
                  content: {
                    $mustache: [
                      pageServerTemplate, {
                        data: {
                          $objectToJson:  {
                            $mergeObjects: ['$frontmatter', { topic: '$topic', headings: '$headings', next: '$next', prev: '$prev' }]
                          }
                        }
                      }
                    ]
                  },
                },
              },
              { $log: { scope: '+page.server.js', message: '$_id' } },
              {
                $writeFile: {
                  content: '$content',
                  to: '$_id',
                }
              }
            ],
            '+page.svelte': [
              { $match: { path: { $nin: [ 'SUMMARY.md' ] } } },
              {
                $set: {
                  svelteBody: { $function: { body: render, args: ['$renderable', tagsPrerender, config.postrender], lang: 'js' } }
                }
              },
              { $set: { svelteBody: { $replaceAll: { input: '$svelteBody', find: '{', replacement: '&lcub;' } } } },
              { $set: { svelteBody: { $replaceAll: { input: '$svelteBody', find: '}', replacement: '&rcub;' } } } },
              {
                $set: {
                  sidenav: {
                    $function: {
                      body: sideNavRender,
                      args: [ '$frontmatter.slug' ],
                      lang: 'js',
                    }
                  }
                } 
              },
              { $set: { customTags: { $concatArrays: ['$customTags', sideNavTags] } } },
              { $set: { imports: { $setIntersection: ['$customTags', config.postrender] } } },
              {
                $project: {
                  _id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.svelte'] },
                  content: {
                    $mustache: [
                      pageTemplate, '$$ROOT'
                    ]
                  },
                },
              },
              { $log: { scope: '+page.svelte', message: '$_id' } },
              {
                $writeFile: {
                  content: '$content',
                  to: '$_id',
                }
              }
            ],
          }
        },
      ]);
    });
}

export function cli() {
  program
    .command('build')
    .argument('<src>', 'documentation folder')
    .argument('<dst>', 'destination project folder')
    .action(async (src: string, dst: string) => {
      await build(src, dst);
    });

  program.parse();
}
