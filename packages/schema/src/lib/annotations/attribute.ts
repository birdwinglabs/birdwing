import { SchemaAttribute } from '@markdoc/markdoc';
import { Annotation, propertyDecorator } from '@tashmet/core';

export type AttributeAnnotationOptions = Omit<SchemaAttribute, 'default'>;

export class AttributeAnnotation extends Annotation {
  constructor(
    private target: any,
    public propertyKey: string,
    private options: AttributeAnnotationOptions,
  ) { super(); }

  get schema(): SchemaAttribute {
    return this.options;
  }
}

export function attribute(options: AttributeAnnotationOptions) {
  return propertyDecorator(({ target, propertyKey }) => new AttributeAnnotation(target, propertyKey, options));
}
