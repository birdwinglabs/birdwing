import { ComponentType } from "@birdwing/renderable";
import { Type } from "@birdwing/renderable/dist/schema";
import { Tag, RenderableTreeNodes } from "@markdoc/markdoc";
import { RenderableNodeCursor } from "./renderable";

export interface TransformResult<TSchema, T extends ComponentType<TSchema>> {
  tag: T["tag"],
  id?: string;
  class?: string;
  ns?: string;
  property?: string;
  properties: {
    [P in keyof T["properties"]]: 
      RenderableNodeCursor<Tag<T["properties"][P]>> |
      Tag<T["properties"][P]> |
      Tag<T["properties"][P]>[]
  };
  refs?: {
    [P in keyof T["refs"]]:
      RenderableNodeCursor<Tag<T["refs"][P]>> |
      Tag<T["refs"][P]> |
      Tag<T["refs"][P]>[]
  };
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
        n.attributes.property = result.ns ? `${result.ns}:${k}` : k;
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

  return new Tag(result.tag, {
    id: result.id,
    property: result.property,
    typeof: type.name,
    class: result.class
  }, Array.isArray(result.children) ? result.children : [result.children]);
}