import { Tag, ValidationError } from '@markdoc/markdoc';
import { schema } from '@birdwing/renderable';
import { attribute, Model, createComponentRenderable, createSchema } from '../lib/index.js';

class ErrorModel extends Model {
  @attribute({ type: String })
  type: string;

  @attribute({ type: String })
  tag: string;

  @attribute({ type: Array })
  lines: number[];

  @attribute({ type: Object })
  error: ValidationError;

  transform() {
    const code = new Tag('td', {}, [this.error.id]);
    const tag = new Tag('td', {}, [this.tag]);
    const level = new Tag('td', {}, [this.error.level]);
    const message = new Tag('td', {}, [this.error.message]);
    //const children = this.transformChildren().wrap('div');

    return createComponentRenderable(schema.Error, {
      tag: 'tr',
      property: 'error',
      properties: {
        code,
        tag,
        level,
        message
      },
      children: [tag, code, level, message],
    });
  }
}

export const error = createSchema(ErrorModel);
