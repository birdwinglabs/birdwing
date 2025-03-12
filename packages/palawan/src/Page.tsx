import { createComponent, Tailwind } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { PageSection, Container } from "./Marketing";
import { Layout } from "./Layout";
import { Navbar } from './Menu';

const DefaultPageSection = PageSection.extend(schema.PageSection, {
  components: [],
  parent: Container,
  tags: {
    h1: "text-3xl mt-2 font-bold tracking-tight text-black dark:text-white sm:text-4xl",
    p: "mt-6 mb-12 text-lg leading-8 text-gray-700 dark:text-gray-300",
  }
})

export const Page = createComponent(schema.Page, {
  components: [DefaultPageSection, Navbar],
  use: [Tailwind],
  render: ({ Slot }) => {
    return (
      <Layout>
        <Slot/>
      </Layout>
    )
  },
});
