import { Fragment } from "./fragment.js";

import path from 'path';
import { Page } from "./page.js";

export class PageDataLoader {
  constructor(private fragments: Fragment[], private urls: Record<string, string>) {}

  async getData(page: Page) {
    function isSubPath(dir: string, root: string) {
      const relative = path.relative(root, dir);
      return dir === root || (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    }

    const f = this.fragments.reduce((obj, f) => {
      if (isSubPath(page.path, f.path)) {
        obj[f.name] = f.transform(this.urls, this);
      }
      return obj;
    }, {} as Record<string, any>);

    return page.data(f);
  }

  pushFragment(fragment: Fragment) {
    for (let i=0; i<this.fragments.length; i++) {
      if (this.fragments[i].name === fragment.name && this.fragments[i].url === fragment.url) {
        this.fragments[i] = fragment;
        return true;
      }
    }
    this.fragments.push(fragment);
    return false;
  }
}
