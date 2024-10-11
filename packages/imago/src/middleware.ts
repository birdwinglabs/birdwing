import React from "react";
import { NodeConfig } from "./interfaces.js";
import { configureNode } from "./factory.js";

export abstract class Middleware<T = any> {
  abstract apply(props: T, next: React.FunctionComponent<any>): any;
}

export type MatchCase<T> = [any, NodeConfig<T>]
export type MatchPropCase<T> = [any, NodeConfig<T>]

export class MatchMiddleware<T> extends Middleware<T> {
  constructor(private cases: MatchCase<T>[]) { super(); }

  apply(props: any, next: React.FunctionComponent<any>) {
    for (const c of this.cases) {
      const match = c[0];
      const config = c[1];
      const fact = configureNode(next, config);

      if (Object.entries(match).every(([key, value]) => props[key] === value)) {
        return fact(props);
      }
    }
    return null;
  }
}

export class Assign extends Middleware {
  constructor(private type: any, private props: any = {}, private replace: boolean) {
    super();
  }

  apply(props: any, next: React.FunctionComponent<any>) {
    return React.createElement(this.type, this.replace ? this.props : { ...props, ...this.props }, props.children);
  }
}

export class AssignProps<T> extends Middleware<T> {
  constructor(private assign: (props: T) => any, private replace: boolean) {
    super();
  }

  apply(props: T, next: React.FunctionComponent<any>) {
    return next(this.replace ? this.assign(props) : { ...props, ...this.assign(props) });
  }
}

export function match<T = any>(cases: MatchCase<T>[]) {
  return new MatchMiddleware(cases);
}

export function matchProp<T = any>(prop: keyof T, cases: MatchPropCase<T>[]) {
  return match<T>(cases.map(c => [{ [prop]: c[0] }, c[1]]));
}

export function replace(type: any, props?: any) {
  return new Assign(type, props, true);
}

export function assign(type: any, props?: any) {
  return new Assign(type, props, false);
}

export function replaceProps<T>(props: Record<string, any> | ((props: any) => any)) {
  return new AssignProps<T>(typeof props === 'object' ? () => props : props, true);
}

export function assignProps<T>(props: Record<string, any> | ((props: T) => any)) {
  return new AssignProps<T>(typeof props === 'object' ? () => props : props, false);
}
