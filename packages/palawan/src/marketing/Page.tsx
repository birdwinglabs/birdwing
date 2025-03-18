import { createComponent, Tailwind } from '@birdwing/imago';
import { schema } from "@birdwing/renderable";
import { Layout } from "../Layout";

export const Page = createComponent(schema.Page, {
  use: [Tailwind],
  parent: Layout,
});
