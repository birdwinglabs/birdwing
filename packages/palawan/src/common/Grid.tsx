import { createComponent, Tailwind } from "@birdwing/imago";
import { schema } from "@birdwing/renderable";
import * as ui from '../Common';
import { Editor } from "./Editor";

export const Grid = createComponent(schema.Grid, {
  use: [Tailwind],
  class: 'mx-1',
  tags: ui.tags,
})
  .useComponent(Editor)
