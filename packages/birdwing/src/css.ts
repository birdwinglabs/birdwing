import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';

export async function generateCss(themePath: string, outPath: string) {
  const cssProc = postcss([
    tailwind({
      config: path.join(themePath, 'tailwind.config.js'),
    })
  ]);

  const cssPath = path.join(themePath, 'main.css');
  const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to: path.join(outPath, 'main.css') });

  return css.css;
}
