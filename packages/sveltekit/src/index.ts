import { program } from 'commander';
import { Aetlan } from '@aetlan/aetlan';

export async function build(src: string, dst: string) {
  return Aetlan
    .connect(src)
    .then(async aetlan => {
      const docs = await aetlan.documents([
        { 
          $set: {
            _id: { $joinPaths: [dst, 'src/routes', '$slug', '+page.mdoc'] },
          }
        }
      ]);

      for (const doc of docs) {
        console.log(doc);
      }
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
