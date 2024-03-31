import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';

export async function build(src: string, dst: string) {

  const server = ({_id, body, ...frontmatter}: any) => {
    return `
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
  return ${JSON.stringify(frontmatter)}
}`
  }

  return Aetlan
    .connect(src)
    .then(async aetlan => {
      const docs = await aetlan.documents([
        {
          $facet: {
            '+page.server.js': [
              {
                $project: {
                  _id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.server.js'] },
                  //content: { $mustache: [server, '$$ROOT'] },
                  content: { $function: { body: server, args: [ '$$ROOT' ], lang: 'js' } },
                }
              },
              { $log: { scope: '+page.server.js', message: '$_id' } },
              //{
                //$writeFile: {
                  //content: '$content',
                  //to: '$_id',
                //}
              //}
              //{ $dump: '$content' }
            ],
            '+page.mdoc': [
              { $log: { scope: '+page.mdoc', message: '$_id' } },
              { $dump: '$$ROOT' },
              { 
                $set: {
                  _id: { $joinPaths: [dst, 'src/routes', '$frontmatter.slug', '+page.mdoc'] },
                  frontmatter: { $objectToYaml: '$frontmatter' },
                },
              },
              {
                $project: {
                  _id: '$_id',
                  content: { $objectToFrontmatter: '$$ROOT' }
                }
              },
            ]
          }
        },
      ]);

      //for (const doc of docs) {
        //console.log(doc);
      //}
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
