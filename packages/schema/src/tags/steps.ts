import Markdoc, { Ast, Node } from '@markdoc/markdoc';
import { headingsToList } from '../util.js';
import { splitLayout } from '../layouts/index.js';
import { schema } from '@birdwing/renderable';
import { SpaceSeparatedNumberList } from '../attributes.js';
import { attribute, group, Model, createComponentRenderable, createSchema } from '../lib/index.js';
import { NodeStream } from '../lib/node.js';
import { name, pageSectionProperties } from './common.js';

class StepsModel extends Model {
  @attribute({ type: SpaceSeparatedNumberList, required: false })
  split: number[];

  processChildren(nodes: Node[]) {
    return super.processChildren(headingsToList()(nodes));
  }

  transform() {
    const children = this.transformChildren({
      list: 'ol',
      item: (node, config) => {
        return Markdoc.transform(
          new Ast.Node('tag', { split: node.attributes.split }, node.children, 'step'), config
        );
      }
    });

    return createComponentRenderable(schema.Steps, {
      tag: 'section',
      property: 'contentSection',
      properties: {
        ...pageSectionProperties(children),
        step: children.flatten().tag('li').typeof('Step')
      },
      children: children.toArray(),
    });
  }
}

class StepModel extends Model {
  @attribute({ type: SpaceSeparatedNumberList, required: false })
  split: number[];

  @group({ section: 0 })
  main: NodeStream;

  @group({ section: 1})
  side: NodeStream;

  transform() {
    const main = this.main.transform();
    const side = this.side.transform();

    return createComponentRenderable(schema.Step, {
      tag: 'li',
      properties: {
        name: name(main),
      },
      children: splitLayout({ split: this.split, mirror: false, main: main.toArray(), side: side.toArray() }).next()
    });
  }
}

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

export const steps = createSchema(StepsModel);

export const step = createSchema(StepModel);
