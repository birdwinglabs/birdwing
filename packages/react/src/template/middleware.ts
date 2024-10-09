import React from "react";
import { NodeConfig, RenderFunction } from "./interfaces.js";
import { configureNode } from "./factory.js";

export abstract class Middleware<T = any> {
  abstract apply(props: T, next: RenderFunction<any>): React.ReactNode;
}

export type MatchCase<T> = [any, NodeConfig<T>]
export type MatchPropCase<T> = [any, NodeConfig<T>]

export class MatchMiddleware<T> extends Middleware<T> {
  constructor(private cases: MatchCase<T>[]) { super(); }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    for (const c of this.cases) {
      const match = c[0];
      const config = c[1];
      const fact = configureNode(next, config);

      if (Object.entries(match).every(([key, value]) => props[key] === value)) {
        return fact(props);
      }
    }
    return '';
  }
}

export class ReplaceTag extends Middleware {
  constructor(private type: any, private props: any = {}) {
    super();
  }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    return React.createElement(this.type, this.props, props.children);
  }
}

export class ReplaceProps<T> extends Middleware<T> {
  constructor(private replace: (props: T) => any) {
    super();
  }

  apply(props: any, next: RenderFunction<any>): React.ReactNode {
    return next(this.replace(props));
  }
}

export class AssignProps<T> extends Middleware<T> {
  constructor(private assign: (props: T) => any) {
    super();
  }

  apply(props: T, next: RenderFunction<any>): React.ReactNode {
    return next({ ...props, ...this.assign(props) });
  }
}

export function match<T = any>(cases: MatchCase<T>[]) {
  return new MatchMiddleware(cases);
}

export function matchProp<T = any>(prop: keyof T, cases: MatchPropCase<T>[]) {
  return match<T>(cases.map(c => [{ [prop]: c[0] }, c[1]]));
}

export function replaceWith(type: any, props?: any) {
  return new ReplaceTag(type, props);
}

export function replaceProps<T>(props: Record<string, any> | ((props: any) => any)) {
  return new ReplaceProps<T>(typeof props === 'object' ? () => props : props);
}

export function assignProps<T>(props: Record<string, any> | ((props: T) => any)) {
  return new AssignProps<T>(typeof props === 'object' ? () => props : props);
}
