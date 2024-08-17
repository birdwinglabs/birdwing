import { Page, Fragment } from "./interfaces.js";

import path from 'path';

export class PageDataLoader {
  constructor(private fragments: Fragment[]) {}

  async getData(page: Page) {
    function isSubPath(dir: string, root: string) {
      const relative = path.relative(root, dir);
      return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
    }

    const f = this.fragments.reduce((obj, f) => {
      if (isSubPath(page.path, f.path)) {
        obj[f.name] = f;
      }
      return obj;
    }, {} as Record<string, Fragment>);

    return page.data(f);
  }

  pushFragment(fragment: Fragment) {
    for (let i=0; i<this.fragments.length; i++) {
      if (this.fragments[i].name === fragment.name && this.fragments[i].path === fragment.path) {
        this.fragments[i] = fragment;
        return true;
      }
    }
    this.fragments.push(fragment);
    return false;
  }
}
