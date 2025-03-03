import { Newable } from "@birdwing/renderable/dist/schema";
import Markdoc, { Ast, Schema, SchemaAttribute } from "@markdoc/markdoc";

import { Model } from "./model.js";
import { AttributeAnnotation } from "./annotations/attribute.js";

export { createComponentRenderable } from "./component.js";
export { attribute } from "./annotations/attribute.js";
export { group, groupList } from "./annotations/group.js";
export { id } from "./annotations/id.js";
export { Model } from './model.js';

export function createSchema<TInput extends Model>(ModelCtr: Newable<TInput>): Schema {
  const attributes: Record<string, SchemaAttribute> = {};

  for (const attr of AttributeAnnotation.onClass(ModelCtr, true)) {
    attributes[attr.propertyKey] = attr.schema;
  }

  return {
    attributes,
    transform: (node, config) => {
      const errors = Markdoc.validate(node, config);

      const model = new ModelCtr(node, config);
      const attr = node.transformAttributes(config);
      for (const k of Object.keys(attr)) {
        (model as any)[k] = attr[k];
      }
      model.node.children = model.processChildren(node.children);

      const errNodes = errors.map(({ type, lines, error }) => {
        console.log(lines);
        return Markdoc.transform(new Ast.Node('tag', { tag: node.tag, type, error, lines: Array.from(lines)  }, [], 'error'), config);
      });

      if (errNodes.length > 0) {
        return [...errNodes, model.transform()].flat();
      }

      return model.transform();
    }
  }
}
