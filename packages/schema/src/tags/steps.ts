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
 * <Steps>
 *  <list ordered=true>
 *    <item>
 *      <grid columns="10">
 *        <tile name="main" colspan="3">
 *          <heading level=1>Step 1</heading>
 *          <paragraph>Content for step</paragraph>
 *        </tile>
 *        <tile name="side" colspan="7">
 *          <fence content="code"/>
 *        </tile>
 *      </grid>
 *    </item>
 *    <item>
 *      <section name="main">
 *        <heading level=1>Step 2</heading>
 *        <paragraph>Content for step 2</paragraph>
 *      </section>
 *    </item>
 *  </list>
 * </Steps>
 */
export const steps: Schema = {
  render: 'Steps',
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
      const body = [Markdoc.transform(s.heading, config), ...main.body.transformFlat(config)];
      const layout = createLayout('container', attr)
        .pushContent('main', body);

      if (side) {
        layout.pushContent('side', side.body.transformFlat(config));
      }

      return new Tag('item', { ordered: true }, [layout.container]);
    });

    return new Tag(this.render, node.transformAttributes(config), [new Tag('list', {}, children)]);
  }
}
