import tailwind from 'tailwindcss';
import postcss from 'postcss';

import path from 'path';
import fs from 'fs';

export async function generateCss(root: string) {
  const cssProc = postcss([
    tailwind({
      config: path.join(root, 'tailwind.config.js'),
    })
  ]);

  const cssPath = path.join(root, 'src/main.css');
  const css = await cssProc.process(fs.readFileSync(cssPath), { from: cssPath, to: path.join(root, 'out/main.css') });

  return css.css;
}