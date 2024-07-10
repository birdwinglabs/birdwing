import { Container, Provider, provider } from '@tashmet/core';
import { op, type OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import Markdoc, { type AstType, type Node } from '@markdoc/markdoc';

export interface MarkdocOptions {

}

export abstract class MarkdocOptions implements MarkdocOptions {}

@provider()
export class MarkdocOperators {
  public constructor(public options: MarkdocOptions) {
  }

  @op.expression('$markdocToAst')
  public markdocToAst(obj: any, expr: string, ctx: OperatorContext) {
    return Markdoc.parse(ctx.compute(obj, expr));
  }

  @op.expression('$astToMarkdoc')
  public markdownToHtml(obj: any, expr: string, ctx: OperatorContext) {
    return Markdoc.format(ctx.compute(obj, expr));
  }

  @op.expression('$markdocAstToRenderable')
  public markdocAstToRenderable(obj: any, expr: any, ctx: OperatorContext) {
    return Markdoc.transform(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
  }

  @op.expression('$markdocRenderableToHtml')
  public markdocRenderableToHtml(obj: any, expr: any, ctx: OperatorContext) {
    const renderable = ctx.compute(obj, expr) as any;
    return Markdoc.renderers.html(renderable);
  }
}

export default (options: MarkdocOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(MarkdocOperators, container)
    .provide(Provider.ofInstance(MarkdocOptions, options));
