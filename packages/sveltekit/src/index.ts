import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';
import prettify from 'html-prettify';

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
              //{ $dump: '$html' },
              //{ $set: { renderable: { $function: { body: pruneFence, args: ['$renderable'], lang: 'js' } }} },
              //{ $set: { svelteBody: { $markdocRenderableToHtml: '$renderable'} } },
              { $set: { svelteBody: '$html' }},
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
                        body: { $function: { body: prettifyHtml, args: ['$svelteBody'], lang: 'js' } },
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
              //{ $dump: '$renderable' },
              {
                $project: {
                  _id: { $joinPaths: [dst, 'src/lib/components/sidenav.svelte'] },
                  content: {
                    $concat: [
                      { $mustache: [
                        sidenavTemplate,
                        {
                          customTags: '$customTags',
                          //body: { $function: { body: prettify, args: ['$svelteBody'], lang: 'js' } },
                        }
                      ] }, { $function: { body: prettifyHtml, args: ['$svelteBody'], lang: 'js' } }
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
            //'+page.mdoc': [
              //{ $log: { scope: '+page.mdoc', message: '$_id' } },
              ////{ $dump: '$$ROOT' },
              //{
                //$set: {
                  //_id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.mdoc'] },
                  //frontmatter: { $objectToYaml: '$frontmatter' },
                //},
              //},
              //{
                //$project: {
                  //_id: '$_id',
                  //content: { $objectToFrontmatter: '$$ROOT' }
                //}
              //},
            //]
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
