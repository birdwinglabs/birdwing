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
 *  <list ordered="true" typeof="Steps">
 *    <item property="step" typeof="Step">
 *      <grid columns="10">
 *        <tile name="main" colspan="3">
 *          <heading level="1" property="name">Step 1</heading>
 *          <paragraph>Content for step</paragraph>
 *        </tile>
 *        <tile name="side" colspan="7">
 *          <fence content="code"/>
 *        </tile>
 *      </grid>
 *    </item>
 *    <item property="step" typeof="Step">
 *      <section name="main">
 *        <heading level="1" property="name">Step 2</heading>
 *        <paragraph>Content for step 2</paragraph>
 *      </section>
 *    </item>
 *  </list>
 */
export const steps: Schema = {
  //render: 'Steps',
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

    const children = steps.map((s, i) => {
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

      const item = new Tag('item', { property: 'step', typeof: 'Step' } as any, [layout.container]);

      if (i == steps.length - 1) {
        item.attributes.last = true;
      }
      return item;
    });

    return new Tag('list', { ordered: true, property: 'contentSection', typeof: 'Steps' }, children);
  }
}
