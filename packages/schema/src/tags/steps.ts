import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';

const { Tag } = Markdoc;

/**
 * Steps component
 * 
 * Turns level 1 headings into steps
 * 
 * @example
 * 
 * ```markdoc
 * {% steps %}
 * # Step 1
 * Content for tab 
 * 
 * <!-- side -->
 * ```
 * code
 * ```
 * 
 * # Step 2
 * Content for tab 2
 * {% /steps %}
 * ```
 */
export const steps: Schema = {
  render: 'Steps',
  transform(node, config) {
    const steps = new NodeList(node.children).headingSections();

    const children = steps.map(s => {
      const { side, body } = s.body.commentSections(['side', 'body'], 'body');

      return new Tag('Step', { side: side.transformFlat(config) }, [
        Markdoc.transform(s.heading, config),
        ...body.transformFlat(config),
      ]);
    });

    return new Tag(this.render, node.transformAttributes(config), children);
  }
}
