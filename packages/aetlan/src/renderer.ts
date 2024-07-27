import markdoc from '@markdoc/markdoc';
import React from 'react';

export class Renderer {
  constructor(private components: any) {}

  render(renderable: any) {
    const namespace = (name: string) => {
      if (name.includes('.')) {
        const ns = name.split('.');
        return { component: ns[0], node: ns[1] };
      } else {
        return { component: name, node: 'layout' };
      }
    }

    return markdoc.renderers.react(renderable, React, { components: (name: string) => {
      const ns = namespace(name);
      if (!(ns.component in this.components)) {
        throw Error(`Missing component '${ns.component}'`);
      }
      return (props: any) => this.components[ns.component][ns.node](props);
    }});
  }
}
