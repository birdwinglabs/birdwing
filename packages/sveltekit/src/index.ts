import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import { compile, render } from './renderer.js';

const pageTemplate = `
<script>
  import Layout from '$lib/layouts/Docs.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import Menu from '$lib/components/Menu.svelte';
  import MenuItem from '$lib/components/MenuItem.svelte';
  import Route from '$lib/components/Route.svelte';
{{#customTags}}
  import {{.}} from '$lib/components/{{.}}.svelte';
{{/customTags}}

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

function pruneFence(node: any) {
  for (const child of node.children) {
    if (child.name === 'Fence') {
      child.children = [];
    }
  }
  return node;
}

function prettifyHtml(html: string) {
  var tab = '\t';
  var result = '';
  var indent= '';

  html.split(/>\s*</).forEach(function(element) {
      if (element.match( /^\/\w/ )) {
          indent = indent.substring(tab.length);
      }

      result += indent + '<' + element + '>\r\n';

      if (element.match( /^<?\w[^>]*[^\/]$/ ) && !element.startsWith("input")  ) { 
          indent += tab;              
      }
  });

  return result.substring(1, result.length-3);
}

export async function build(src: string, dst: string) {
  return Aetlan
    .connect(src)
    .then(async aetlan => {
      const tags: any = {
        Hint: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Hint.svelte'),
        Fence: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Fence.svelte'),
        SideNav: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/SideNav.svelte'),
        Menu: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Menu.svelte'),
        MenuItem: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/MenuItem.svelte'),
        //Route: await compile('/home/bander10/Documents/code/svelte-docs/src/lib/components/Route.svelte'),
      }

      const sideNavRender = await aetlan.createSideNavRenderer((node: any) => render(node, tags));

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
                  svelteBody: { $function: { body: render, args: ['$renderable', tags], lang: 'js' } }
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
