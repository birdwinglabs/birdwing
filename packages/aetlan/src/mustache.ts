import { Container, provider } from '@tashmet/core';
import { op, type OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import mustache from 'mustache';


@provider()
export class MustacheOperators {
  @op.expression('$mustache')
  public mustache(obj: any, expr: string, ctx: OperatorContext) {
    return mustache.render(ctx.compute(obj, expr[0]), ctx.compute(obj, expr[1]));
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(MustacheOperators, container);
