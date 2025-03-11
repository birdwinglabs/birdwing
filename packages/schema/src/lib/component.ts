import { AbstractElementWrapper, ComponentType } from "@birdwing/renderable";
import { Type } from "@birdwing/renderable/dist/schema";
import { Tag, RenderableTreeNodes } from "@markdoc/markdoc";
import { RenderableNodeCursor } from "./renderable";
import * as renderable from '@birdwing/renderable';
import { PropertyNode } from "@birdwing/renderable/dist/types";

export class TagWrapper extends AbstractElementWrapper<Tag> {
  get children(): AbstractElementWrapper<Tag>[] {
    return this.elem.children.filter(c => Tag.isTag(c)).map(t => new TagWrapper(t));
  }

  get attributes() {
    return this.elem.attributes;
  }

  get text() {
    return this.elem.children.filter(c => !Tag.isTag(c)).join(' ');
  }
}

export type PropertyInput<TSchema, T extends ComponentType<TSchema>> = {
  [P in keyof T["properties"]]: 
    RenderableNodeCursor<Tag<T["properties"][P]>> |
    Tag<T["properties"][P]> |
    Tag<T["properties"][P]>[]
};

export type RefInput<TSchema, T extends ComponentType<TSchema>> = {
  [P in keyof T["refs"]]: 
    RenderableNodeCursor<Tag<T["refs"][P]>> |
    Tag<T["refs"][P]> |
    Tag<T["refs"][P]>[]
};

export interface PropertyMapping {
  ns?: string;
  additional?: string[]
}

export interface TransformResult<TSchema, T extends ComponentType<TSchema>> {
  tag: T["tag"],
  id?: string;
  class?: string;
  property?: string;
  properties: Partial<PropertyInput<TSchema, T>>,
  refs?: Partial<RefInput<TSchema, T>>,
  children: RenderableTreeNodes;
}

export function createComponentRenderable<TOutput extends ComponentType<object>>(
  type: Type<TOutput>,
  result: TransformResult<TOutput["schema"], TOutput>
) {
  for (const [k, v] of Object.entries(result.properties)) {
    const tags: Tag[] = v instanceof RenderableNodeCursor ? v.nodes : Array.isArray(v) ? v : [v];

    tags.forEach(n => {
      if (Tag.isTag(n)) {
        n.attributes.property = k
      }
    });
  }

  for (const [k, v] of Object.entries(result.refs || {})) {
    const tags: Tag[] = v instanceof RenderableNodeCursor ? v.nodes : Array.isArray(v) ? v : [v];

    tags.forEach(n => {
      if (Tag.isTag(n)) {
        n.attributes['data-name'] = k;
      }
    });
  }

  const tag = new Tag(result.tag, {
    id: result.id,
    property: result.property,
    typeof: type.name,
    class: result.class
  }, Array.isArray(result.children) ? result.children : [result.children]);

  //if (type.name === 'MusicPlaylist') {
    //const node = new TagWrapper(tag).parseStrict(renderable.schema.MusicPlaylist, renderable.schema);

    //const nodeMap = new Map<Tag, PropertyNode<Tag, any>>();
    //for (const n of node.walk()) {
      //nodeMap.set(n.element, n);
    //}

    //console.log(nodeMap);
  //}

  return tag;
}