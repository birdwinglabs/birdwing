import { Tag } from '@markdoc/markdoc';
import { Renderer } from './renderer';

export interface ContentProps {
  components: any;

  tag: Tag;
}

export function Content({ components, tag }: ContentProps) {
  const renderer = new Renderer(components);

  return <>{ renderer.render(tag) }</>;
}
