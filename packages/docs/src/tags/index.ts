import { CustomTag } from '@aetlan/aetlan';

export class Hint extends CustomTag {
  readonly render = 'Hint';
  readonly attributes = {
    style: {
      type: String
    }
  };
}
