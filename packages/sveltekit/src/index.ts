import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import { compile, render } from './renderer.js';

const pageTemplate = `
<script>
{{#customTags}}
  import {{.}} from '$lib/components/{{.}}.svelte';
{{/customTags}}

  export let data;

  const { frontmatter } = data;
</script>

{{{body}}}
`;

const sidenavTemplate = `
<script>
{{#customTags}}
  import {{.}} from '$lib/components/{{.}}.svelte';
{{/customTags}}

  export let slug;
</script>

{{{body}}}
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
      }

      const docs = await aetlan.documents([
        {
          $facet: {
            'data.json': [
              { $match: { path: { $nin: [ 'SUMMARY.md' ] } } },
              {
                $group: {
                  _id: { $joinPaths: [dst, 'src/routes/docs/data.json'] },
                  items: {
                    $push: {
                      k: '$frontmatter.slug',
                      v: { $mergeObjects: ['$frontmatter', { topic: '$topic', headings: '$headings', next: '$next', prev: '$prev' }] }
                    },
                  }
                },
              },
              {
                $project: {
                  _id: 1,
                  content: { $objectToJson: { $arrayToObject: '$items' } },
                },
              },
              { $log: { scope: 'data.json', message: '$_id' } },
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
                $project: {
                  _id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.svelte'] },
                  content: {
                    $mustache: [
                      pageTemplate,
                      {
                        customTags: '$customTags',
                        //body: { $function: { body: prettifyHtml, args: ['$svelteBody'], lang: 'js' } },
                        body: '$svelteBody'
                      }
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
            'sidenav.svelte': [
              { $match: { path: 'SUMMARY.md' } },
              { $set: { renderable: { $function: { body: pruneFence, args: ['$renderable'], lang: 'js' } }} },
              { $set: { svelteBody: { $markdocRenderableToHtml: '$renderable'} } },
              { $set: { svelteBody: { $replaceAll: { input: '$svelteBody', find: '{', replacement: '&lcub;' } } } },
              { $set: { svelteBody: { $replaceAll: { input: '$svelteBody', find: '}', replacement: '&rcub;' } } } },
              {
                $project: {
                  _id: { $joinPaths: [dst, 'src/lib/components/sidenav.svelte'] },
                  content: {
                    $mustache: [
                      sidenavTemplate,
                      {
                        customTags: '$customTags',
                        body: { $function: { body: prettifyHtml, args: ['$svelteBody'], lang: 'js' } },
                      }
                    ]
                  },
                },
              },
              { $log: { scope: 'sidenav.svelte', message: '$_id' } },
              {
                $writeFile: {
                  content: '$content',
                  to: '$_id',
                }
              }
            ]
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
