import { createComponent, Tailwind } from "@birdwing/imago";
import { schema } from "@birdwing/renderable";

export interface FooterOptions {
  Container: React.FunctionComponent<any>;

  class?: string;
}

export const FooterTopic = createComponent(schema.Topic, {
  properties: {
    name: 'text-sm uppercase my-4 font-semibold',
  }
})
  .useComponent(schema.LinkItem, {
    class: 'my-4 text-sm',
    tags: {
      a: 'hover:border-stone-400 border-b border-transparent',
    }
  });

export const Footer = ({ Container, ...options }: FooterOptions) => createComponent(schema.Footer, {
  use: [Tailwind],
  class: options.class || 'mb-12',
  tags: {
    nav: 'my-6',
  },
  properties: {
    copyright: 'border-t border-stone-200 py-6 text-sm text-stone-600',
  },
  children: ({ children }) => {
    return <Container>{ children }</Container>;
  }
})
  .useComponent(FooterTopic);

