import Markdoc, { Ast, Schema } from '@markdoc/markdoc';
import { createFactory, headingsToList, tag } from '../util.js';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { SpaceSeparatedNumberList } from '../attributes.js';

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
 * ---
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
    split: {
      type: SpaceSeparatedNumberList,
      required: false,
      render: true,
    },
    level: {
      type: Number,
      required: false,
      default: 1,
    }
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);

    const stepsFact = createFactory(schema.Steps, {
      tag: 'ol',
      property: 'contentSection',
      nodes: [
        headingsToList(attr.heading),
      ],
      transforms: {
        item: (node, config) => Markdoc.transform(
          new Ast.Node('tag', { split: node.attributes.split }, node.children, 'step'), config
        ),
      },
      properties: {
        step: tag({ match: { tag: 'li', deep: true }}),
      },
    });

    return stepsFact.createTag(node, config);
  }
}

export const step: Schema = {
  attributes: {
    split: {
      type: SpaceSeparatedNumberList,
      required: false
    },
  },
  transform(node, config) {
    const attr = node.transformAttributes(config);
    const split = attr.split as number[];

    return createFactory(schema.Step, {
      tag: 'li',
      groups: [
        { name: 'main', section: 0 },
        { name: 'side', section: 1 },
      ],
      properties: {
        name: tag({ group: 'main', match: 'h1' }),
      },
      project: p => splitLayout({
        split,
        mirror: false,
        main: p.group('main'),
        side: p.group('side'),
      })
    }).createTag(node, config);
  }
}