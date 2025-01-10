import React from "react";
import { AbstractSelector, Matcher, NodeType, TagProps } from "./interfaces";
import { TemplateContext } from "./Imago";


export class Selector<T extends NodeType> extends AbstractSelector<T> {
  constructor(
    type: T | T[],
    private matchers: Matcher<TagProps<T>>[] = [],
  ) { super(Array.isArray(type) ? type : [type]); }

  match(props: TagProps<T>): boolean {
    return this.matchers.every(m => m(props));
  }

  condition(condition: Matcher<TagProps<T>>) {
    return new Selector(this.types, [...this.matchers, condition]);
  }

  property(value: string) {
    return this.attr({ property: value } as any);
  }

  typeof(type: string) {
    return this.attr({ typeof: type } as any);
  }

  name(name: string) {
    return this.attr({ name } as any);
  }

  tag<U extends T>(type: U) {
    return new Selector<U>(type, this.matchers);
  }

  get first() {
    return this.condition(({ index }) => index === 0);
  }

  get notFirst() {
    return this.condition(({ index }) => index > 0);
  }

  get last() {
    return this.condition(({ isLast }) => isLast);
  }

  get notLast() {
    return this.condition(({ isLast }) => !isLast);
  }

  class(...name: string[]): Selector<T> {
    return this.condition(({ className }) => {
      const classes = (className as string || '').split(' ');
      return name.every(c => classes.indexOf(c) >= 0)
    });
  }

  notClass(name: string): Selector<T> {
    return this.condition(({ className }) => !((className as string || '').split(' ').includes(name)));
  }

  attr(attrs: Partial<TagProps<T>>): Selector<T> {
    return this.condition(props => Object.entries(attrs).every(([k, v]) => v === undefined || (props as any)[k] === v));
  }

  notAttr(name: string): Selector<T> {
    return this.condition(props => !Object.keys(props).includes(name));
  }

  child(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).some(c => React.isValidElement(c) && selector.match(c.props));
    });
  }

  notChild(selector: Selector<any>) {
    return this.condition(({ children }) => {
      const nodes = React.isValidElement(children) && children.type === TemplateContext.Provider
        ? children.props.children
        : children;

      return React.Children.toArray(nodes).every(c => !React.isValidElement(c) || !selector.match(c.props));
    });
  }
}
