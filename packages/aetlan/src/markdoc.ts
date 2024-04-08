import { Container, Provider, provider } from '@tashmet/core';
import { op, type OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import Markdoc, { type AstType, type Node } from '@markdoc/markdoc';

export interface MarkdocOptions {

}

export abstract class MarkdocOptions implements MarkdocOptions {}

const keys = (x: any) => {
  //console.log(x);
  return Object.getOwnPropertyNames(x); //.concat(Object.getOwnPropertyNames(x?.__proto__))
}
const isObject = (v: any) => Object.prototype.toString.call(v) === '[object Object]'

const toPlainObject = (clss: any) => {
  if (isObject(clss)) {
    return keys(clss ?? {}).reduce((object, key) => {
      const [val, arr, obj] = [clss[key], Array.isArray(clss[key]), isObject(clss[key])];
      object[key] = arr ? val.map(toPlainObject) : obj ? toPlainObject(val) : val
      return object
    }, {} as any)
  } else {
    return clss;
  }
}

export function objectToAst(obj: any) {
  return Markdoc.Ast.fromJSON(JSON.stringify(obj));
}


@provider()
export class MarkdocOperators {
  public constructor(public options: MarkdocOptions) {
    console.log('Markdoc');
  }

  @op.expression('$markdocToAst')
  public markdocToAst(obj: any, expr: string, ctx: OperatorContext) {
    return Markdoc.parse(ctx.compute(obj, expr));
  }

  //@op.expression('$markdocToObject')
  //public markdocToObject(obj: any, expr: string, ctx: OperatorContext) {
    //return toPlainObject(this.markdocToAst(obj, expr, ctx));
  //}

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

  //@op.expression('$toObject')
  //public toObject(obj: any, expr: any, ctx: OperatorContext) {
    //return toPlainObject(ctx.compute(obj, expr));
  //}
}

export default (options: MarkdocOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(MarkdocOperators, container)
    .provide(Provider.ofInstance(MarkdocOptions, options));
