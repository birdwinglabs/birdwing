import { Tag } from '@markdoc/markdoc';
import { Renderer } from './renderer';
import { Template } from './interfaces';

export interface ContentProps {
  template: Template;

  tag: Tag;
}

export function Content({ template, tag }: ContentProps) {
  const renderer = new Renderer(template);

  return <>{ renderer.render(tag) }</>;
}
