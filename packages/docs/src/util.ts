export function extractLinks(ast: any): any[] {
  let heading: string | undefined;
  let meta: any[] = [];

  for (const node of ast.walk()) {
    switch (node.type) {
      case 'heading':
        for (const child of node.walk()) {
          if (child.type === 'text') {
            heading = child.attributes.content;
          }
        }
        break;
      case 'link':
        const href = node.attributes.href;
        let title = '';
        for (const child of node.walk()) {
          if (child.type === 'text') {
            title = child.attributes.content;
          }
        }
        meta.push({ href, title, topic: heading });
        break;
    }
  }

  return meta;
}
