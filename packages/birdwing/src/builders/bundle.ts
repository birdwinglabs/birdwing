import * as esbuild from 'esbuild'

export abstract class BundleBuilder {
  abstract code: string;
  abstract resolveDir: string;

  async build(): Promise<string> {
    const build = await esbuild.build({
      stdin: {
        contents: this.code,
        loader: 'jsx',
        resolveDir: this.resolveDir,
      },
      bundle: true,
      logLevel: 'silent',
      format: 'cjs',
      outfile: 'out.js',
      write: false,
    });

    if (!build.outputFiles) {
      throw Error('No output files from build');
    }
    return build.outputFiles[0].text
  }
}
