import Markdoc, { Schema } from '@markdoc/markdoc';
import { NodeList } from '../util';
import { createLayout } from '../layouts';

const { Tag } = Markdoc;

/**
 * Steps component
 * 
 * Turns level 1 headings into steps
 * 
 * @example
 * 
 * ```markdoc
 * {% steps fractions="3 7" %}
 * # Step 1
 * Content for step 
 * 
 * <!-- side -->
 * ```
 * code
 * ```
 * 
 * # Step 2
 * Content for step 2
 * {% /steps %}
 * ```
 * @output
 *  <ol typeof="Steps">
 *    <li property="step" typeof="Step">
 *      <div data-layout="grid" data-columns="10">
 *        <div data-name="main" data-colspan="3">
 *          <h1 property="name">Step 1</h1>
 *          <p>Content for step</p>
 *        </div>
 *        <div data-name="side" data-colspan="7">
 *          <pre>code</pre>
 *        </div>
 *      </div>
 *    </li>
 *    <li property="step" typeof="Step">
 *      <div data-name="main">
 *        <h1 property="name">Step 2</h1>
 *        <p>Content for step 2</p>
 *      </div>
 *    </li>
 *  </ol>
 */
export const steps: Schema = {
  attributes: {
    'layout': {
      type: String,
      default: 'stack',
      matches: [
        'stack',
        '2-column',
      ],
      required: false,
    },
    'fractions': {
      type: String,
      default: '1 1',
      required: false,
    },
  },
  transform(node, config) {
    const steps = new NodeList(node.children).headingSections();
    const attr = node.transformAttributes(config);

    const children = steps.map(s => {
      const [main, side] = s.body.splitByHr();
      const heading = Markdoc.transform(s.heading, config);
      if (heading instanceof Tag) {
        heading.attributes.property = 'name';
      }
      const body = [heading, ...main.body.transformFlat(config)];
      const layout = createLayout(attr)
        .pushContent(body, { name: 'main' });

      if (side) {
        layout.pushContent(side.body.transformFlat(config), { name: 'side' });
      }

      return new Tag('li', { property: 'step', typeof: 'Step' }, [layout.container]);
    });

    return new Tag('ol', { property: 'contentSection', typeof: 'Steps' }, children);
  }
}
