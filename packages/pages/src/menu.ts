import { PageData, Fragment, nodes } from '@aetlan/aetlan';
import Markdoc from '@markdoc/markdoc';

export class Menu extends Fragment {
  readonly name = 'menu';
  readonly path = '/';

  constructor(
    public readonly renderable: any,
  ) {
    super();
  }

  static fromDocument(page: PageData, urls: Record<string, string>) {
    const renderable = Markdoc.transform(page.ast, {
      tags: {},
      nodes,
      variables: {
        context: 'Menu',
        urls,
        path: '/',
      }
    });

    return new Menu(renderable);
  }
}
